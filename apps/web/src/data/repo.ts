import * as demo from "./demo";
import type { Invoice, Profile, SettledTrip, Spend, Trip, TripCardInfo } from "./types";

/**
 * Titik sambung data untuk web. Sekarang hanya ada implementasi demo (read-only, tanpa login).
 * Saat Envio dan kontrak sudah ter-deploy, buat implementasi live dengan antarmuka yang sama
 * (saldo/aktivitas dari Envio, label dari apps/api) lalu ganti `repo` di bawah — halaman tidak berubah.
 * Lihat docs/decisions/0004-web-dashboard-demo.md.
 */
export interface TripRepository {
  listTrips(): Promise<Trip[]>;
  listSettledTrips(): Promise<SettledTrip[]>;
  getTrip(id: string): Promise<Trip | null>;
  getSpend(tripId: string, spendId: string): Promise<Spend | null>;
  listInvoices(tripId: string): Promise<Invoice[]>;
  getInvoiceByNumber(number: string): Promise<Invoice | null>;
  getProfile(): Promise<Profile>;
  getTripCard(): Promise<TripCardInfo>;
}

const demoRepo: TripRepository = {
  async listTrips() {
    return Object.values(demo.trips);
  },
  async listSettledTrips() {
    return demo.settledTrips;
  },
  async getTrip(id) {
    return demo.trips[id] ?? null;
  },
  async getSpend(tripId, spendId) {
    const spend = demo.spends[spendId];
    return spend && spend.tripId === tripId ? spend : null;
  },
  async listInvoices(tripId) {
    return Object.values(demo.invoices).filter((i) => i.tripId === tripId);
  },
  async getInvoiceByNumber(number) {
    return Object.values(demo.invoices).find((i) => i.number.toLowerCase() === number.toLowerCase()) ?? null;
  },
  async getProfile() {
    return demo.profile;
  },
  async getTripCard() {
    return demo.tripCard;
  },
};

export const repo: TripRepository = demoRepo;

/** ID trip yang di-prerender (halaman tetap statis). */
export const DEMO_TRIP_IDS = Object.keys(demo.trips);
export const DEMO_SPEND_IDS = Object.keys(demo.spends);
export const DEMO_INVOICE_NUMBERS = Object.values(demo.invoices).map((i) => i.number);
