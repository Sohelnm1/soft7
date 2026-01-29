/**
 * Fetch WABA ID and phone number ID(s) using the business token from embedded signup.
 * Meta's redirect often doesn't include waba_id/phone_number_id; we get them via Graph API.
 */
export async function fetchWabaAndPhoneFromToken(accessToken: string): Promise<{
  wabaId: string | null;
  phoneNumberId: string | null;
  phoneNumber: string | null;
} | null> {
  try {
    const meRes = await fetch(
      `https://graph.facebook.com/v22.0/me?fields=owned_whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number}}&access_token=${encodeURIComponent(accessToken)}`,
      { method: "GET" },
    );
    const meData = await meRes.json();
    if (meData.owned_whatsapp_business_accounts?.data?.length) {
      const waba = meData.owned_whatsapp_business_accounts.data[0];
      const wabaId = waba.id;
      const phones = waba.phone_numbers?.data || [];
      const firstPhone = phones[0];
      return {
        wabaId,
        phoneNumberId: firstPhone?.id ?? null,
        phoneNumber: firstPhone?.display_phone_number ?? null,
      };
    }
    const wabaRes = await fetch(
      `https://graph.facebook.com/v22.0/me/owned_whatsapp_business_accounts?fields=id,name,phone_numbers{id,display_phone_number}&access_token=${encodeURIComponent(accessToken)}`,
      { method: "GET" },
    );
    const wabaData = await wabaRes.json();
    if (wabaData.data?.length) {
      const waba = wabaData.data[0];
      const phones = waba.phone_numbers?.data || [];
      const firstPhone = phones[0];
      return {
        wabaId: waba.id,
        phoneNumberId: firstPhone?.id ?? null,
        phoneNumber: firstPhone?.display_phone_number ?? null,
      };
    }
  } catch (e) {
    console.error("Failed to fetch WABA/phone from Graph API:", e);
  }
  return null;
}

export function isPlaceholderMetaId(id: string | null | undefined): boolean {
  return !!id && (id.startsWith("embedded_") || /^embedded_\d+$/.test(id));
}
