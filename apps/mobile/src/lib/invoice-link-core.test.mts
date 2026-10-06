// Feature: tekosue-rebrand-live-web, Property 6: URL verifikasi — round trip token (bagian mobile)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { buildInvoiceVerifyLabel, buildInvoiceVerifyUrl } from './invoice-link-core.ts';

const number = fc
  .tuple(fc.nat({ max: 10_000 }), fc.integer({ min: 1, max: 9999 }))
  .map(([g, i]) => `INV-${g}-${String(i).padStart(3, '0')}`);

test('the verify URL carries the access key exactly; the label never does', () => {
  fc.assert(
    fc.property(number, fc.string({ minLength: 1, maxLength: 60 }), (n, key) => {
      const url = new URL(buildInvoiceVerifyUrl('tekosue.xyz', n, key));
      assert.equal(url.host, 'tekosue.xyz');
      assert.equal(url.pathname, `/v/${n}`);
      assert.equal(url.searchParams.get('token'), key);
      const label = buildInvoiceVerifyLabel('tekosue.xyz', n);
      assert.equal(label, `tekosue.xyz/v/${n}`);
      assert.doesNotMatch(label, /token|\?/i);
    }),
    { numRuns: 100 },
  );
});

test('no query without an access key', () => {
  for (const key of [undefined, null, '']) {
    assert.equal(buildInvoiceVerifyUrl('tekosue.xyz', 'INV-1-001', key), 'https://tekosue.xyz/v/INV-1-001');
  }
});
