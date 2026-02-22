import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";

export const EXPLORER_BASE = "https://testnet.explorer.perawallet.app";

let _algod: algosdk.Algodv2 | null = null;
let _indexer: algosdk.Indexer | null = null;
let _pera: PeraWalletConnect | null = null;

export function getAlgod() {
  if (!_algod) _algod = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", 443);
  return _algod;
}

export function getIndexer() {
  if (!_indexer) _indexer = new algosdk.Indexer("", "https://testnet-idx.algonode.cloud", 443);
  return _indexer;
}

export function getPeraWallet() {
  if (!_pera) _pera = new PeraWalletConnect({ network: "testnet", shouldShowSignTxnToast: true });
  return _pera;
}

export function shortenAddress(address: string, chars = 4) {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function explorerTxUrl(txId: string)      { return `${EXPLORER_BASE}/tx/${txId}`; }
export function explorerAssetUrl(asaId: number)  { return `${EXPLORER_BASE}/asset/${asaId}`; }

// ── ARC-69 note builder ───────────────────────────────────────────────────────

function buildNote(type: string, props: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({
    standard: "arc69",
    description: `Eden Pods — ${type}`,
    external_url: "https://edenpods.earth",
    properties: { ...props, eden_type: type, eden_version: 1 },
  }));
}

// ── Mint throw NFT ────────────────────────────────────────────────────────────

export interface ThrowMetadata {
  podTypeId: string; podTypeName: string; podTypeIcon: string;
  throwDate: string; locationLabel: string;
  growthModelId: string; thrownBy: string; version: number;
}

export async function buildMintThrowTxns(params: {
  senderAddress: string;
  metadata: ThrowMetadata;
}): Promise<algosdk.Transaction[]> {
  const sp = await getAlgod().getTransactionParams().do();
  const name = `Eden Throw ${params.metadata.podTypeIcon} ${params.metadata.podTypeName}`.slice(0, 32);

  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from:            params.senderAddress,
    assetName:       name,
    unitName:        "THROW",
    total:           1,
    decimals:        0,
    defaultFrozen:   false,
    manager:         params.senderAddress,
    reserve:         params.senderAddress,
    assetURL:        "https://edenpods.earth",
    note:            buildNote("throw", params.metadata),
    suggestedParams: sp,
  });

  return [txn];
}

// ── Harvest note txn ──────────────────────────────────────────────────────────

export async function buildHarvestTxn(
  senderAddress: string,
  props: { throwAsaId: number; plantId: string; quantityClass: string; harvestedAt: string; notes: string }
): Promise<algosdk.Transaction> {
  const sp = await getAlgod().getTransactionParams().do();
  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: senderAddress, to: senderAddress, amount: 0,
    note: buildNote("harvest", props),
    suggestedParams: sp,
  });
}

// ── Sign + send via Pera ──────────────────────────────────────────────────────

export async function signAndSendTxns(
  txns: algosdk.Transaction[],
  senderAddress: string
): Promise<{ txIds: string[]; assetId?: number }> {
  const pera  = getPeraWallet();
  const algod = getAlgod();

  if (txns.length > 1) algosdk.assignGroupID(txns);

  const toSign = txns.map((txn) => ({ txn, signers: [senderAddress] }));
  const signed  = await pera.signTransaction([toSign]);

  const txIds: string[] = [];
  let assetId: number | undefined;

  for (const s of signed) {
    const { txId } = await algod.sendRawTransaction(s).do();
    txIds.push(txId);
    const result = await algosdk.waitForConfirmation(algod, txId, 4);
    if (result["asset-index"]) assetId = result["asset-index"] as number;
  }

  return { txIds, assetId };
}

// ── Indexer: fetch throws ─────────────────────────────────────────────────────

export interface OnChainThrow {
  asaId: number; txId: string; throwDate: string;
  podTypeId: string; podTypeName: string; podTypeIcon: string;
  locationLabel: string; growthModelId: string;
  thrownBy: string; confirmedAt: string; explorerUrl: string;
}

export interface OnChainHarvest {
  txId: string; throwAsaId: number; plantId: string;
  quantityClass: "small" | "medium" | "large";
  harvestedAt: string; notes: string; confirmedAt: string;
}

function parseNote(b64: string): Record<string, unknown> | null {
  try {
    const txt = atob(b64);
    const obj = JSON.parse(txt);
    if (obj?.standard === "arc69" && obj?.properties?.eden_type) return obj.properties;
    return null;
  } catch { return null; }
}

export async function fetchThrowsForAddress(address: string): Promise<OnChainThrow[]> {
  const indexer = getIndexer();
  const out: OnChainThrow[] = [];
  try {
    const resp = await indexer.searchForAssets().creator(address).do();
    for (const asset of (resp.assets ?? [])) {
      const txResp = await indexer.searchForTransactions().assetID(asset.index).txType("acfg").do();
      const txns   = txResp.transactions ?? [];
      if (!txns.length) continue;
      const latest = txns[txns.length - 1];
      if (!latest.note) continue;
      const props = parseNote(latest.note);
      if (!props || props.eden_type !== "throw") continue;
      const rt = latest["round-time"] as number;
      out.push({
        asaId:         asset.index as number,
        txId:          latest.id as string,
        throwDate:     props.throwDate as string ?? new Date(rt * 1000).toISOString(),
        podTypeId:     props.podTypeId as string ?? "",
        podTypeName:   props.podTypeName as string ?? "",
        podTypeIcon:   props.podTypeIcon as string ?? "🌱",
        locationLabel: props.locationLabel as string ?? "",
        growthModelId: props.growthModelId as string ?? "temperate-herb",
        thrownBy:      props.thrownBy as string ?? address,
        confirmedAt:   new Date(rt * 1000).toISOString(),
        explorerUrl:   explorerAssetUrl(asset.index as number),
      });
    }
  } catch (e) { console.warn("fetchThrows failed:", e); }
  return out.sort((a, b) => new Date(b.throwDate).getTime() - new Date(a.throwDate).getTime());
}

export async function fetchHarvestsForAddress(address: string): Promise<OnChainHarvest[]> {
  const indexer = getIndexer();
  const out: OnChainHarvest[] = [];
  try {
    const resp = await indexer.searchForTransactions().address(address).addressRole("sender").txType("pay").do();
    for (const txn of (resp.transactions ?? [])) {
      if (!txn.note) continue;
      const props = parseNote(txn.note);
      if (!props || props.eden_type !== "harvest") continue;
      const rt = txn["round-time"] as number;
      out.push({
        txId:          txn.id as string,
        throwAsaId:    props.throwAsaId as number,
        plantId:       props.plantId as string ?? "",
        quantityClass: (props.quantityClass as "small" | "medium" | "large") ?? "small",
        harvestedAt:   props.harvestedAt as string ?? new Date(rt * 1000).toISOString(),
        notes:         props.notes as string ?? "",
        confirmedAt:   new Date(rt * 1000).toISOString(),
      });
    }
  } catch (e) { console.warn("fetchHarvests failed:", e); }
  return out.sort((a, b) => new Date(b.harvestedAt).getTime() - new Date(a.harvestedAt).getTime());
}
