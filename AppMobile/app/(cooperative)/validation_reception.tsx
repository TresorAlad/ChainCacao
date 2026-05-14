import { Redirect, useLocalSearchParams } from 'expo-router';

function firstParam(v: string | string[] | undefined): string {
  if (v === undefined || v === null) return '';
  return Array.isArray(v) ? String(v[0] ?? '').trim() : String(v).trim();
}

/** Compat : anciens liens vers (cooperative)/validation_reception → écran partagé. */
export default function ValidationReceptionRedirect() {
  const params = useLocalSearchParams();
  const lotId = firstParam(params.lotId as string | string[] | undefined);
  if (!lotId) {
    return <Redirect href="/(cooperative)/accueil" />;
  }
  return <Redirect href={{ pathname: '/confirmer-reception-lot', params: { lotId } }} />;
}
