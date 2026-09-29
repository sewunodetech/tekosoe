import type { AvatarTint } from "@/components/ui/avatar";
import { usd } from "@/lib/money";
import type { Invoice, Member, Profile, Spend, TripCardInfo, Trip } from "./types";

/**
 * Data DEMO: cerita Rina/Wei/Jack di Jepang. Salinan dari apps/mobile/src/data/demo/index.ts.
 * Halaman tidak boleh meng-import file ini langsung — pakai `repo` (data/repo.ts).
 * TODO: ekstrak fixture ini ke packages/shared supaya mobile dan web memakai satu sumber.
 */

const tint = (t: AvatarTint) => t;

export const members = {
  rina: { id: "rina", name: "Rina", label: "Rina", city: "Jakarta, Indonesia", country: "Indonesia", tint: tint("bg-apricot") },
  wei: { id: "wei", name: "Wei", label: "Wei", city: "Singapore", country: "Singapore", tint: tint("bg-green-soft") },
  jack: { id: "jack", name: "Jack", label: "You", city: "Sydney, Australia", country: "Australia", tint: tint("bg-sky") },
  dewi: { id: "dewi", name: "Dewi", label: "Dewi", city: "Bandung, Indonesia", country: "Indonesia", tint: tint("bg-violet-soft") },
  mei: { id: "mei", name: "Mei", label: "Mei", city: "Osaka, Japan", country: "Japan", tint: tint("bg-butter") },
  lukas: { id: "lukas", name: "Lukas", label: "Lukas", city: "Berlin, Germany", country: "Germany", tint: tint("bg-peach-soft") },
} satisfies Record<string, Member>;

const japanMembers = [members.rina, members.wei, members.jack];

export const spends: Record<string, Spend> = {
  dinner: {
    id: "dinner",
    tripId: "japan",
    title: "Dinner in Shibuya",
    icon: "food",
    amount: usd(90),
    paidBy: members.rina,
    forWhom: "for everyone",
    shares: japanMembers.map((member) => ({ member, share: usd(30) })),
    when: "Oct 9, 8:42 PM",
    hasReceipt: true,
  },
  ramen: {
    id: "ramen",
    tripId: "japan",
    title: "Ramen and karaoke",
    icon: "music",
    amount: usd(60),
    paidBy: members.wei,
    forWhom: "for Rina and Wei",
    shares: [
      { member: members.rina, share: usd(30) },
      { member: members.wei, share: usd(30) },
    ],
    when: "Oct 10, 9:15 PM",
    hasReceipt: false,
  },
  train: {
    id: "train",
    tripId: "japan",
    title: "Train tickets to Kyoto",
    icon: "train",
    amount: usd(150),
    paidBy: members.jack,
    forWhom: "for everyone",
    shares: japanMembers.map((member) => ({ member, share: usd(50) })),
    when: "Oct 11, 9:12 AM",
    hasReceipt: true,
  },
};

export const trips: Record<string, Trip> = {
  japan: {
    id: "japan",
    name: "Japan Trip",
    pot: usd(150),
    myBalance: usd(70),
    members: japanMembers,
    countries: "Indonesia · Singapore · Australia",
    status: "6 days left",
    settlesOn: "Oct 14",
    approvalLimit: usd(100),
    activity: [spends.ramen, spends.dinner],
    settleToday: [
      { member: members.rina, amount: usd(40) },
      { member: members.wei, amount: usd(40) },
      { member: members.jack, amount: usd(70) },
    ],
  },
  euro: {
    id: "euro",
    name: "Euro Summer",
    pot: usd(1240),
    myBalance: usd(200),
    members: [members.rina, members.dewi, members.wei, members.jack, members.mei, members.lukas],
    countries: "Indonesia · Singapore · +3 more",
    status: "Starts in 12 days",
    settlesOn: "Aug 30",
    approvalLimit: usd(200),
    activity: [],
    settleToday: [],
  },
};

export const settledTrips = [{ name: "Bali Weekend", returnAmount: usd("12.5") }];

export const profile: Profile = {
  name: "Jack",
  city: "Sydney",
  country: "Australia",
  tint: "bg-sky",
  stats: { activeTrips: 2, settled: 1, gotBack: usd("12.5") },
};

const commonLines = {
  deposit: { date: "Oct 8", title: "You put in", sub: "Deposit", amount: usd(100), positive: true },
  dinner: { date: "Oct 9", title: "Dinner in Shibuya", sub: "Your share of $90.00", amount: -usd(30) },
  ramen: { date: "Oct 10", title: "Ramen and karaoke", sub: "Your share of $60.00", amount: -usd(30) },
  train: { date: "Oct 11", title: "Train tickets to Kyoto", sub: "Your share of $150.00", amount: -usd(50) },
};

export const invoices: Record<string, Invoice> = {
  jack: {
    number: "INV-JPN-0003",
    tripId: "japan",
    who: "jack",
    status: "refunded",
    owner: members.jack,
    headline: "+$20.00",
    headlineTone: "positive",
    subline: "Japan Trip · Oct 8–14, 2026 · Jack, Sydney",
    lines: [
      commonLines.deposit,
      commonLines.dinner,
      commonLines.train,
      { date: "Oct 14", title: "Refund at settle-up", sub: "Sent to your balance", amount: -usd(20) },
    ],
    totals: [
      { label: "Put in", value: usd(100) },
      { label: "Your shares", value: usd(80) },
      { label: "Refunded to you", value: usd(20) },
      { label: "Left in the trip", value: 0n, strong: true },
    ],
  },
  wei: {
    number: "INV-JPN-0002",
    tripId: "japan",
    who: "wei",
    status: "due",
    owner: members.wei,
    headline: "$5.00 to pay",
    headlineTone: "text",
    subline: "Your safety net covered $5 of the $10 you were short.",
    lines: [
      commonLines.deposit,
      commonLines.dinner,
      commonLines.ramen,
      commonLines.train,
      { date: "Oct 14", title: "Safety net collected", sub: "Up to the $5 you allowed", amount: usd(5), positive: true },
    ],
    totals: [
      { label: "Short at settle-up", value: usd(10) },
      { label: "Covered by safety net", value: usd(5) },
      { label: "Still to pay", value: usd(5), strong: true },
    ],
  },
  rina: {
    number: "INV-JPN-0001",
    tripId: "japan",
    who: "rina",
    status: "paid",
    owner: members.rina,
    headline: "$0.00 to pay",
    headlineTone: "text",
    subline: "Your safety net covered the $10 you were short.",
    lines: [
      commonLines.deposit,
      commonLines.dinner,
      commonLines.ramen,
      commonLines.train,
      { date: "Oct 14", title: "Safety net collected", sub: "From the $50 you allowed", amount: usd(10), positive: true },
    ],
    totals: [
      { label: "Short at settle-up", value: usd(10) },
      { label: "Covered by safety net", value: usd(10) },
      { label: "Still to pay", value: 0n, strong: true },
    ],
  },
};

export const settlement = {
  tripId: "japan",
  date: "Oct 14",
  rows: [
    { member: members.rina, put: usd(100), used: usd(110), net: -usd(10) },
    { member: members.wei, put: usd(100), used: usd(110), net: -usd(10) },
    { member: members.jack, put: usd(100), used: usd(80), net: usd(20) },
  ],
};

export const tripCard: TripCardInfo = {
  tripName: "Japan Trip",
  last4: "4821",
  canSpend: usd(150),
  tapLimit: usd(100),
  shops: [
    { id: "konbini", name: "Konbini Shibuya", note: "Snacks and water", amount: usd(12), tint: "bg-sky" },
    { id: "taxi", name: "Tokyo Taxi", note: "Ride to hotel", amount: usd(24), tint: "bg-apricot" },
  ],
};
