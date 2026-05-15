import * as SecureStore from 'expo-secure-store';
import { secp256k1 } from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha2';
import { canonicalLotPayload, type LotSignPayload } from '@/lib/lot-payload';

const PRIV_KEY = 'chaincacao_ecdsa_priv_v1';
const PUB_KEY = 'chaincacao_ecdsa_pub_v1';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/i, '');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function getOrCreateKeyPair(): Promise<{ priv: Uint8Array; pub: Uint8Array }> {
  const storedPriv = await SecureStore.getItemAsync(PRIV_KEY);
  const storedPub = await SecureStore.getItemAsync(PUB_KEY);
  if (storedPriv && storedPub) {
    return { priv: hexToBytes(storedPriv), pub: hexToBytes(storedPub) };
  }
  const priv = secp256k1.utils.randomPrivateKey();
  const pub = secp256k1.getPublicKey(priv, true);
  await SecureStore.setItemAsync(PRIV_KEY, bytesToHex(priv), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await SecureStore.setItemAsync(PUB_KEY, bytesToHex(pub), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return { priv, pub };
}

export async function getSignerPublicKeyHex(): Promise<string> {
  const { pub } = await getOrCreateKeyPair();
  return bytesToHex(pub);
}

/** Signature ECDSA (secp256k1) du hash SHA-256 du payload canonique. */
export async function signLotPayload(payload: LotSignPayload): Promise<{
  signature: string;
  payload_hash: string;
  signer_pubkey: string;
}> {
  const { priv, pub } = await getOrCreateKeyPair();
  const canonical = canonicalLotPayload(payload);
  const msgHash = sha256(new TextEncoder().encode(canonical));
  const sig = await secp256k1.signAsync(msgHash, priv);
  return {
    signature: bytesToHex(sig),
    payload_hash: bytesToHex(msgHash),
    signer_pubkey: bytesToHex(pub),
  };
}

/** Vérifie qu’un payload n’a pas été altéré localement avant sync. */
export async function verifyLotPayload(
  payload: LotSignPayload,
  signatureHex: string,
  pubkeyHex: string
): Promise<boolean> {
  try {
    const msgHash = sha256(new TextEncoder().encode(canonicalLotPayload(payload)));
    const sig = hexToBytes(signatureHex);
    const pub = hexToBytes(pubkeyHex);
    return secp256k1.verify(sig, msgHash, pub);
  } catch {
    return false;
  }
}
