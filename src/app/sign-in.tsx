import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Monogram } from '@/components/brand/BrandMark';
import { StackHeader } from '@/components/chrome/StackHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/ui/GoldRule';
import { AuthError, normalizeEmail, normalizeOtp } from '@/lib/auth';
import { hapticSuccess } from '@/lib/haptics';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { authIsAvailable, useSessionStore } from '@/stores/session';
import { hairline, radii, spacing } from '@/theme/tokens';

const errorKeys: Record<AuthError['code'], TranslationKey> = {
  invalid_email: 'signIn.errorEmail',
  invalid_code: 'signIn.errorCode',
  expired: 'signIn.errorExpired',
  rate_limited: 'signIn.errorRateLimited',
  network: 'common.offlineBody',
  unknown: 'common.errorBody',
};

function errorKey(error: unknown): TranslationKey {
  return error instanceof AuthError ? errorKeys[error.code] : 'common.errorBody';
}

/** Two steps: email, then the one-time code from the email. */
export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();
  const requestCode = useSessionStore((state) => state.requestCode);
  const verifyCode = useSessionStore((state) => state.verifyCode);

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [notice, setNotice] = useState<TranslationKey | null>(null);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/account');
  };

  const sendCode = async () => {
    const clean = normalizeEmail(email);
    if (!clean) return setError('signIn.errorEmail');
    setBusy(true);
    setError(null);
    try {
      await requestCode(clean);
      setEmail(clean);
      setCode('');
      setStep('code');
      setNotice('signIn.codeSent');
    } catch (caught) {
      setError(errorKey(caught));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!normalizeOtp(code)) return setError('signIn.errorCode');
    setBusy(true);
    setError(null);
    try {
      await verifyCode(email, code);
      hapticSuccess();
      close();
    } catch (caught) {
      setError(errorKey(caught));
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = [
    styles.input,
    { borderColor: colors.goldLine, backgroundColor: colors.input, color: colors.text },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StackHeader title={t('signIn.title')} eyebrow={t('account.eyebrow')} onBack={close} />
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['4xl'] }]}>
          <View style={styles.mark}>
            <Monogram size={64} color={colors.text} gold={colors.accent} />
          </View>

          {!authIsAvailable ? (
            <View style={styles.block}>
              <AppText variant="titleSmall" align="center" maxScale={1.2}>
                {t('signIn.unavailableTitle')}
              </AppText>
              <AppText variant="bodySmall" tone="secondary" align="center" maxScale={1.3}>
                {t('signIn.unavailableBody')}
              </AppText>
            </View>
          ) : step === 'email' ? (
            <View style={styles.block}>
              <AppText variant="titleSmall" align="center" maxScale={1.2}>
                {t('signIn.emailTitle')}
              </AppText>
              <AppText variant="bodySmall" tone="secondary" align="center" maxScale={1.3}>
                {t('signIn.emailBody')}
              </AppText>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError(null);
                }}
                onSubmitEditing={sendCode}
                placeholder="name@example.com"
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel={t('signIn.emailLabel')}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="send"
                autoFocus
                style={[inputStyle, styles.ltr]}
              />
              <Button label={t('signIn.sendCode')} icon="arrow" iconPosition="end" loading={busy} onPress={sendCode} />
            </View>
          ) : (
            <View style={styles.block}>
              <AppText variant="titleSmall" align="center" maxScale={1.2}>
                {t('signIn.codeTitle')}
              </AppText>
              <AppText variant="bodySmall" tone="secondary" align="center" maxScale={1.3}>
                {t('signIn.codeBody', { email })}
              </AppText>
              <TextInput
                value={code}
                onChangeText={(value) => {
                  setCode(value);
                  setError(null);
                }}
                onSubmitEditing={confirm}
                placeholder="••••••"
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel={t('signIn.codeLabel')}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={12}
                returnKeyType="done"
                autoFocus
                style={[inputStyle, styles.ltr, styles.code]}
              />
              <Button label={t('signIn.confirm')} icon="check" loading={busy} onPress={confirm} />
              <View style={styles.secondary}>
                <Button
                  label={t('signIn.resend')}
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  disabled={busy}
                  onPress={sendCode}
                />
                <Button
                  label={t('signIn.changeEmail')}
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  disabled={busy}
                  onPress={() => {
                    setStep('email');
                    setNotice(null);
                    setError(null);
                  }}
                />
              </View>
            </View>
          )}

          {error ? (
            <AppText variant="bodySmall" tone="danger" align="center" accessibilityLiveRegion="polite" maxScale={1.3}>
              {t(error)}
            </AppText>
          ) : notice ? (
            <AppText variant="caption" tone="success" align="center" accessibilityLiveRegion="polite" maxScale={1.3}>
              {t(notice)}
            </AppText>
          ) : null}

          <GoldRule width="40%" style={styles.rule} />
          <AppText variant="caption" tone="tertiary" align="center" maxScale={1.2}>
            {t('signIn.privacy')}
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    gap: spacing.xl,
  },
  mark: {
    alignItems: 'center',
  },
  block: {
    gap: spacing.md,
  },
  input: {
    height: 52,
    borderWidth: hairline,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    outlineStyle: 'none',
  } as object,
  ltr: {
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  code: {
    fontSize: 22,
    letterSpacing: 8,
  },
  secondary: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rule: {
    alignSelf: 'center',
  },
});
