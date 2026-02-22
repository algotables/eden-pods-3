/**
 * Eden Pods — Algorand integration
 * 
 * Pera Wallet connect + ARC-69 NFT minting + Indexer reads
 * Testnet only for PoC
 */

import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";

// ─── Network config (testnet) ─────────────────────────────────────────────────

export const NETWORK = "testnet";

// Free public nodes — no API key needed
export const ALGOD_CONFIG = {
  server: "https://testnet-api.algonode.cloud",
  port: 443,
  token: "",
};

export const INDEXER_CONFIG = {
  server: "https://testnet-idx.algonode.cloud",
  port: 443,
  token: "",
};

export const EXPLORER_BASE = "https://testnet.explorer.perawallet.app";

// ─── Clients (singleton) ──────────────────────────────────────────────────────

let _algod: algosdk.Algodv2 | null = null;
let _indexer: algosdk.Indexer | null = null;
let _pera: PeraWalletConnect | null = null;

export function getAlgod(): algosdk.Algodv2 {
  if (!_algod) {
    _algod = new algosdk.Algodv2(
      ALGOD_CONFIG.token,
      ALGOD_CONFIG.server,
      ALGOD_CONFIG.port
    );
  }
  return _algod;
}

export function getIndexer(): algosdk.Indexer {
  if (!_indexer) {
    _indexer = new algosdk.Indexer(
      INDEXER_CONFIG.token,
      INDEXER_CONFIG.server,
      INDEXER_CONFIG.port
    );
  }
  return _indexer;
}

export function getPeraWallet(): PeraWalletConnect {
  if (!_pera) {
    _pera = new PeraWalletConnect({
      network: NETWORK,
      shouldShowSignTxnToast: true,
    });
  }
  return _pera;
}

// ─── ARC-69 Metadata ──────────────────────────────────────────────────────────

export interface ThrowMetadata {
  podTypeId: string;
  podTypeName: string;
  podTypeIcon: string;
  throwDate: string;       // ISO
  locationLabel: string;
  growthModelId: string;
  thrownBy: string;        // wallet address
  version: number;
}

export interface HarvestMetadata {
  throwAsaId: number;
  plantId: string;
  quantityClass: "small" | "medium" | "large";
  harvestedAt: string;     // ISO
  notes: string;
}

export interface ObservationMetadata {
  throwAsaId: number;
  stageId: string;
  observedAt: string;
  notes: string;
}

// ARC-69 envelope
function buildArc69Note(type: "throw" | "harvest" | "observation", properties: Record<string, unknown>): Uint8Array {
  const metadata = {
    standard: "arc69",
    description: type === "throw"
      ? "Eden Pods — Pod throw record"
      : type === "harvest"
      ? "Eden Pods — Harvest record"
      : "Eden Pods — Growth observation",
    external_url: "https://edenpods.earth",
    properties: {
      ...properties,
      eden_type: type,
      eden_version: 1,
    },
  };
  return new TextEncoder().encode(JSON.stringify(metadata));
}

// ─── ASA Creation (Throw NFT) ─────────────────────────────────────────────────

export interface MintThrowParams {
  senderAddress: string;
  metadata: ThrowMetadata;
}

export async function buildMintThrowTxns(
  params: MintThrowParams
): Promise<algosdk.Transaction[]> {
  const algod = getAlgod();
  const suggestedParams = await algod.getTransactionParams().do();

  const assetName = `Eden Throw — ${params.metadata.podTypeIcon} ${params.metadata.podTypeName}`;
  const unitName = "THROW";

  const note = buildArc69Note("throw", {
    podTypeId:     params.metadata.podTypeId,
    podTypeName:   params.metadata.podTypeName,
    podTypeIcon:   params.metadata.podTypeIcon,
    throwDate:     params.metadata.throwDate,
    locationLabel: params.metadata.locationLabel,
    growthModelId: params.metadata.growthModelId,
    thrownBy:      params.metadata.thrownBy,
  });

  // ASA create transaction
  const createTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from:            params.senderAddress,
    assetName:       assetName.slice(0, 32),   // max 32 chars
    unitName:        unitName,
    total:           1,                          // NFT = supply of 1
    decimals:        0,
    defaultFrozen:   false,
    manager:         params.senderAddress,       // can update metadata
    reserve:         params.senderAddress,
    freeze:          undefined,
    clawback:        undefined,
    assetURL:        "https://edenpods.earth",
    note:            note,
    suggestedParams: suggestedParams,
  });

  return [createTxn];
}

// ─── Harvest record (note-field txn referencing ASA) ─────────────────────────

export async function buildHarvestTxn(
  senderAddress: string,
  metadata: HarvestMetadata
): Promise<algosdk.Transaction> {
  const algod = getAlgod();
  const suggestedParams = await algod.getTransactionParams().do();

  const note = buildArc69Note("harvest", {
    throwAsaId:    metadata.throwAsaId,
    plantId:       metadata.plantId,
    quantityClass: metadata.quantityClass,
    harvestedAt:   metadata.harvestedAt,
    notes:         metadata.notes,
  });

  // 0-ALGO payment to self with structured note
  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from:            senderAddress,
    to:              senderAddress,
    amount:          0,
    note:            note,
    suggestedParams: suggestedParams,
  });
}

// ─── Sign + Send via Pera ─────────────────────────────────────────────────────

export interface SignAndSendResult {
  txIds: string[];
  assetId?: number;  // populated when an ASA was created
}

export async function signAndSendTxns(
  txns: algosdk.Transaction[],
  senderAddress: string
): Promise<SignAndSendResult> {
  const pera = getPeraWallet();
  const algod = getAlgod();

  // Group transactions if needed
  if (txns.length > 1) {
    algosdk.assignGroupID(txns);
  }

  // Format for Pera
  const txnsToSign = txns.map((txn) => ({
    txn,
    signers: [senderAddress],
  }));

  // Pera signs — opens mobile app or extension
  const signedTxns = await pera.signTransaction([txnsToSign]);

  // Broadcast
  const txIds: string[] = [];
  let assetId: number | undefined;

  for (let i = 0; i < signedTxns.length; i++) {
    const { txId } = await algod.sendRawTransaction(signedTxns[i]).do();
    txIds.push(txId);

    // Wait for confirmation
    const result = await algosdk.waitForConfirmation(algod, txId, 4);

    // If this was an ASA creation, grab the asset ID
    if (result["asset-index"]) {
      assetId = result["asset-index"] as number;
    }
  }

  return { txIds, assetId };
}

// ─── Indexer queries ──────────────────────────────────────────────────────────

export interface OnChainThrow {
  asaId: number;
  txId: string;
  throwDate: string;
  podTypeId: string;
  podTypeName: string;
  podTypeIcon: string;
  locationLabel: string;
  growthModelId: string;
  thrownBy: string;
  confirmedAt: string;   // block timestamp ISO
  explorerUrl: string;
}

export interface OnChainHarvest {
  txId: string;
  throwAsaId: number;
  plantId: string;
  quantityClass: "small" | "medium" | "large";
  harvestedAt: string;
  notes: string;
  confirmedAt: string;
}

function parseArc69Note(noteB64: string): Record<string, unknown> | null {
  try {
    const decoded = atob(noteB64);
    const parsed = JSON.parse(decoded);
    if (parsed?.standard === "arc69" && parsed?.properties?.eden_type) {
      return parsed.properties as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchThrowsForAddress(
  address: string
): Promise<OnChainThrow[]> {
  const indexer = getIndexer();
  const throws: OnChainThrow[] = [];

  try {
    // Fetch all ASAs created by this address
    const assetResp = await indexer
      .searchForAssets()
      .creator(address)
      .do();

    const assets = assetResp.assets ?? [];

    for (const asset of assets) {
      // Fetch the creation transaction to get ARC-69 note
      const txnResp = await indexer
        .searchForTransactions()
        .assetID(asset.index)
        .txType("acfg")   // asset config = creation
        .do();

      const txns = txnResp.transactions ?? [];
      if (txns.length === 0) continue;

      // Most recent acfg txn has latest metadata (ARC-69 update pattern)
      const latestTxn = txns[txns.length - 1];
      if (!latestTxn.note) continue;

      const props = parseArc69Note(latestTxn.note);
      if (!props || props.eden_type !== "throw") continue;

      const roundTime = latestTxn["round-time"] as number;

      throws.push({
        asaId:         asset.index as number,
        txId:          latestTxn.id as string,
        throwDate:     props.throwDate as string ?? new Date(roundTime * 1000).toISOString(),
        podTypeId:     props.podTypeId as string ?? "",
        podTypeName:   props.podTypeName as string ?? "",
        podTypeIcon:   props.podTypeIcon as string ?? "🌱",
        locationLabel: props.locationLabel as string ?? "",
        growthModelId: props.growthModelId as string ?? "temperate-herb",
        thrownBy:      props.thrownBy as string ?? address,
        confirmedAt:   new Date(roundTime * 1000).toISOString(),
        explorerUrl:   `${EXPLORER_BASE}/asset/${asset.index}`,
      });
    }
  } catch (err) {
    console.warn("fetchThrowsForAddress failed:", err);
  }

  // Sort by throw date descending
  return throws.sort(
    (a, b) => new Date(b.throwDate).getTime() - new Date(a.throwDate).getTime()
  );
}

export async function fetchHarvestsForAddress(
  address: string
): Promise<OnChainHarvest[]> {
  const indexer = getIndexer();
  const harvests: OnChainHarvest[] = [];

  try {
    // Fetch 0-ALGO self-payment txns with eden arc69 notes
    const txnResp = await indexer
      .searchForTransactions()
      .address(address)
      .addressRole("sender")
      .txType("pay")
      .do();

    const txns = txnResp.transactions ?? [];

    for (const txn of txns) {
      if (!txn.note) continue;
      const props = parseArc69Note(txn.note);
      if (!props || props.eden_type !== "harvest") continue;

      const roundTime = txn["round-time"] as number;

      harvests.push({
        txId:          txn.id as string,
        throwAsaId:    props.throwAsaId as number,
        plantId:       props.plantId as string ?? "",
        quantityClass: props.quantityClass as "small" | "medium" | "large" ?? "small",
        harvestedAt:   props.harvestedAt as string ?? new Date(roundTime * 1000).toISOString(),
        notes:         props.notes as string ?? "",
        confirmedAt:   new Date(roundTime * 1000).toISOString(),
      });
    }
  } catch (err) {
    console.warn("fetchHarvestsForAddress failed:", err);
  }

  return harvests.sort(
    (a, b) => new Date(b.harvestedAt).getTime() - new Date(a.harvestedAt).getTime()
  );
}

// ─── Wallet helpers ───────────────────────────────────────────────────────────

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function explorerTxUrl(txId: string): string {
  return `${EXPLORER_BASE}/tx/${txId}`;
}

export function explorerAssetUrl(asaId: number): string {
  return `${EXPLORER_BASE}/asset/${asaId}`;
}

export async function getAccountBalance(address: string): Promise<number> {
  try {
    const algod = getAlgod();
    const info = await algod.accountInformation(address).do();
    return (info.amount as number) / 1_000_000; // microALGO → ALGO
  } catch {
    return 0;
  }
}
