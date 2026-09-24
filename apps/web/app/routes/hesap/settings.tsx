import { useEffect, useState } from 'react';

import { ApiError, api } from '~/lib/api';
import { useAuth } from '~/lib/auth';
import { formatDate } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { AuthUser } from '~/lib/types';
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  SuccessNote,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Hesap Ayarları',
    description: 'Profil bilgilerinizi ve şifrenizi güncelleyin.',
    path: '/hesap/ayarlar',
    noindex: true,
  });
}

type Profile = AuthUser & { createdAt?: string; lastLoginAt?: string | null };

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  const [pwd, setPwd] = useState({ current: '', next: '', again: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdErr, setPwdErr] = useState<string | null>(null);

  useEffect(() => {
    void api
      .get<Profile>('/users/me')
      .then((p) => {
        setProfile(p);
        setForm({ fullName: p.fullName, phone: p.phone ?? '' });
      })
      .catch(() => undefined);
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr(null);
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await api.patch('/users/me', {
        fullName: form.fullName,
        phone: form.phone || undefined,
      });
      await refreshUser();
      setProfileMsg('Bilgileriniz güncellendi.');
    } catch (err) {
      setProfileErr(
        err instanceof ApiError ? err.message : 'Güncellenemedi.',
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdErr(null);
    setPwdMsg(null);
    if (pwd.next !== pwd.again) {
      setPwdErr('Yeni şifreler eşleşmiyor.');
      return;
    }
    setSavingPwd(true);
    try {
      const res = await api.patch<{ message: string }>('/users/me/password', {
        currentPassword: pwd.current,
        newPassword: pwd.next,
      });
      setPwdMsg(res.message);
      setPwd({ current: '', next: '', again: '' });
    } catch (err) {
      setPwdErr(err instanceof ApiError ? err.message : 'Şifre değiştirilemedi.');
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <>
      <PanelHeader
        title="Hesap ayarları"
        description="Profil bilgileriniz ve güvenlik."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Profil ── */}
        <Card className="p-6 md:p-8">
          <h2 className="font-sans text-lg font-semibold">Profil bilgileri</h2>
          <form onSubmit={saveProfile} className="mt-6 grid gap-5">
            {profileErr && <ErrorNote>{profileErr}</ErrorNote>}
            {profileMsg && <SuccessNote>{profileMsg}</SuccessNote>}

            <Field label="Ad Soyad" required htmlFor="fullName">
              <Input
                id="fullName"
                required
                minLength={2}
                maxLength={120}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </Field>

            <Field label="Telefon" htmlFor="phone">
              <Input
                id="phone"
                type="tel"
                placeholder="0532 000 00 00"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>

            {/*
              E-posta bilerek salt okunur: değiştirmek doğrulama akışı
              gerektirir, aksi halde hesap ele gecirilebilir.
            */}
            <Field label="E-posta" htmlFor="email" hint="E-posta adresi değiştirilemez">
              <Input id="email" value={user?.email ?? ''} disabled readOnly />
            </Field>

            <Button type="submit" loading={savingProfile} className="justify-self-start">
              Kaydet
            </Button>
          </form>

          {profile?.createdAt && (
            <p className="mt-6 border-t border-line-soft pt-4 text-xs text-ink-faint">
              Üyelik tarihi: {formatDate(profile.createdAt)}
              {profile.lastLoginAt && (
                <> · Son giriş: {formatDate(profile.lastLoginAt)}</>
              )}
            </p>
          )}
        </Card>

        {/* ── Şifre ── */}
        <Card className="p-6 md:p-8">
          <h2 className="font-sans text-lg font-semibold">Şifre değiştir</h2>
          <p className="mt-1.5 text-sm text-ink-muted">
            Şifrenizi değiştirdiğinizde diğer cihazlardaki oturumlar kapatılır.
          </p>

          <form onSubmit={savePassword} className="mt-6 grid gap-5">
            {pwdErr && <ErrorNote>{pwdErr}</ErrorNote>}
            {pwdMsg && <SuccessNote>{pwdMsg}</SuccessNote>}

            <Field label="Mevcut şifreniz" required htmlFor="current">
              <Input
                id="current"
                type="password"
                required
                autoComplete="current-password"
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
              />
            </Field>

            <Field label="Yeni şifre" required htmlFor="next" hint="En az 8 karakter">
              <Input
                id="next"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
              />
            </Field>

            <Field label="Yeni şifre tekrar" required htmlFor="again">
              <Input
                id="again"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={pwd.again}
                onChange={(e) => setPwd({ ...pwd, again: e.target.value })}
              />
            </Field>

            <Button type="submit" loading={savingPwd} className="justify-self-start">
              Şifreyi Güncelle
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
