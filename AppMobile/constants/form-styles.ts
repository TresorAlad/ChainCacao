import type { TextStyle } from 'react-native';

/** Texte bien visible dans les champs (connexion / inscription). */
export const FORM_TEXT_COLOR = '#111827';
export const FORM_PLACEHOLDER_COLOR = '#6B7280';
export const FORM_BG = '#FFFFFF';
export const FORM_BORDER = '#CBD5E1';

export const formLabelStyle: TextStyle = {
  fontSize: 12,
  color: '#374151',
  fontWeight: '700',
  textTransform: 'uppercase',
  marginBottom: 8,
};

export const formInputStyle = {
  backgroundColor: FORM_BG,
  borderRadius: 14,
  padding: 16,
  marginBottom: 18,
  borderWidth: 1.5,
  borderColor: FORM_BORDER,
  fontSize: 16,
  color: FORM_TEXT_COLOR,
} as const;

export const formPasswordRowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: FORM_BG,
  borderRadius: 14,
  borderWidth: 1.5,
  borderColor: FORM_BORDER,
  marginBottom: 18,
};

export const formPasswordInputStyle = {
  flex: 1,
  padding: 16,
  fontSize: 16,
  color: FORM_TEXT_COLOR,
};
