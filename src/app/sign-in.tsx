import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Monogram } from '@/components/brand/BrandMark';
import { StackHeader } from '@/components/chrome/StackHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { AuthError, isAcceptablePassword, MIN_PASSWORD_LENGTH, normalizeEmail } from '@/lib/auth';
import { hapticSuccess, hapticTap } from '@/lib/haptics';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { authIsAvailable, useSessionStore } from '@/stores/session';
import { hairline, radii, spacing } from '@/theme/tokens';

const errorKeys: Record<AuthError['code'], TranslationKey> = {
  invalid_email: 'signIn.errorEmail',
  invalid_credentials: 'signIn.errorCredentials',
  weak_password: 'signIn.errorPassword',
  user_exists: 'signIn.errorExists',
  needs_confirmation: 'signIn.errorConfirmation',
  rate_limited: 'signIn.errorRateLimited',
  network: 'common.offlineBody',
  unknown: 'common.errorBody',
};

function errorKey(error: unknown): TranslationKey {
  return error instanceof AuthError ? errorKeys[error.code] : 'common.errorBody';
}

/** Email + password. One form; a link switches between sign in and new account. */
export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();
  const signIn = useSessionStore((state) => state.signIn);
  const signUp = useSessionStore((state) => state.signUp);

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ key: TranslationKey; count?: number } | null>(null);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/account');
  };

  const submit = async () => {
    if (busy) return;
    if (!normalizeEmail(email)) return setError({ key: 'signIn.errorEmail' });
    if (mode === 'signUp' && !isAcceptablePassword(password)) {
      return setError({ key: 'signIn.errorPassword', count: MIN_PASSWORD_LENGTH });
    }
    if (!password) return setError({ key: 'signIn.errorCredentials' });
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signUp') await signUp(email, password);
      else await signIn(email, password);
      hapticSuccess();
      close();
    } catch (caught) {
      setError({ key: errorKey(caught), count: MIN_PASSWORD_LENGTH });
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    hapticTap();
    setMode(mode === 'signIn' ? 'signUp' : 'signIn');
    setError(null);
  };

  const inputStyle = [
    styles.input,
    { borderColor: colors.goldLine, backgroundColor: colors.input, color: colors.text },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StackHeader
        title={mode === 'signIn' ? t('signIn.title') : t('signIn.createTitle')}
        eyebrow={t('account.eyebrow')}
        onBack={close}
      />
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
          ) : (
            <View style={styles.block}>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError(null);
                }}
                placeholder={t('signIn.emailLabel')}
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel={t('signIn.emailLabel')}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                style={[inputStyle, styles.ltr]}
              />
              <View>
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError(null);
                  }}
                  onSubmitEditing={submit}
                  placeholder={t('signIn.passwordLabel')}
                  placeholderTextColor={colors.textTertiary}
                  accessibilityLabel={t('signIn.passwordLabel')}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                  textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
                  returnKeyType="go"
                  style={[inputStyle, styles.ltr]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? t('signIn.hidePassword') : t('signIn.showPassword')}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                  style={styles.eye}>
                  <AppText variant="caption" tone="secondary" maxScale={1.1}>
                    {showPassword ? t('signIn.hidePassword') : t('signIn.showPassword')}
                  </AppText>
                </Pressable>
              </View>

              {error ? (
                <AppText variant="bodySmall" tone="danger" align="center" accessibilityLiveRegion="polite" maxScale={1.3}>
                  {t(error.key, { count: error.count ?? MIN_PASSWORD_LENGTH })}
                </AppText>
              ) : null}

              <Button
                label={mode === 'signIn' ? t('signIn.submit') : t('signIn.create')}
                icon={mode === 'signIn' ? 'user' : 'plus'}
                loading={busy}
                onPress={submit}
              />
              <Button
                label={mode === 'signIn' ? t('signIn.toCreate') : t('signIn.toSignIn')}
                variant="ghost"
                size="sm"
                disabled={busy}
                onPress={switchMode}
              />
            </View>
          )}
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
    paddingHorizontal: 64,
    fontSize: 16,
    outlineStyle: 'none',
  } as object,
  ltr: {
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  eye: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
