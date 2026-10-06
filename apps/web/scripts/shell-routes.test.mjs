// Feature: tekosue-rebrand-live-web, Property 5: Semua path undangan/verifikasi diarahkan ke shell
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { resolveShell } from "./shell-routes.mjs";

const segment = fc.string({ minLength: 1, maxLength: 80 }).filter((s) => !s.includes("/")).map((s) => encodeURIComponent(s));

test("every /j and /v path resolves to its shell", () => {
  fc.assert(
    fc.property(segment, (seg) => {
      assert.equal(resolveShell(`/j/${seg}`), "/j/_.html");
      assert.equal(resolveShell(`/j/${seg}/`), "/j/_.html");
      assert.equal(resolveShell(`/v/${seg}`), "/v/_.html");
      assert.equal(resolveShell(`/v/${seg}/`), "/v/_.html");
    }),
    { numRuns: 100 },
  );
});

test("other paths are not rewritten", () => {
  for (const path of ["/", "/trips/japan", "/j", "/j/", "/j/a/b", "/v/a/b", "/.well-known/assetlinks.json", "/jj/a"]) {
    assert.equal(resolveShell(path), null, path);
  }
});
