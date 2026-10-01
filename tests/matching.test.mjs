// Run with: node tests/matching.test.mjs
import assert from 'node:assert/strict';
import { computeMatchScore, findMatches } from '../lib/matching.js';

const day = (n) => new Date(Date.UTC(2026, 8, 10 + n)).toISOString();
const base = {
  lost: { id: 'L', type: 'lost', status: 'active', title: 'Black Leather Wallet', category: 'Wallet', color: 'Black', brand: '',
    description: 'Black leather wallet with college ID and SBI card', location: 'Library', eventDate: '2026-09-10', createdAt: day(0), imageUrl: 'placeholder', aiTags: [] },
  found: { id: 'F', type: 'found', status: 'active', title: 'Wallet found', category: 'Wallet', color: 'Black', brand: '',
    description: 'Found a black leather wallet containing a college ID and SBI card', location: 'Library', eventDate: '2026-09-11', createdAt: day(1), aiTags: [] }
};
const tags = ['Black', 'Black leather bi-fold wallet with ID card slots'];
const lostImg = { ...base.lost, aiTags: tags };
const foundImg = { ...base.found, aiTags: tags };
const s = (a, b) => computeMatchScore(a, b).overall;
let n = 0; const ok = (name, cond, info = '') => { assert.ok(cond, `${name} ${info}`); n++; console.log(`PASS  ${name}  ${info}`); };

// The four image situations
const A = s(lostImg, foundImg), B = s(lostImg, base.found), C = s(base.lost, foundImg), D = s(base.lost, base.found);
ok('A lost img + found img', A >= 70, `(${A}%)`);
ok('B lost img + found no img', B >= 70, `(${B}%)`);
ok('C lost no img + found img', C >= 70, `(${C}%)`);
ok('D lost no img + found no img', D >= 70, `(${D}%)`);
ok('missing image is not a big penalty (A vs D within 10 pts)', Math.abs(A - D) <= 10, `(A=${A}, D=${D})`);
ok('findMatches surfaces D case', findMatches(base.lost, [base.found]).length === 1);

// Clearly different items sharing broad category / context must not be strong
const laptopBag = { ...base.found, id: 'F2', title: 'Grey backpack', category: 'Bag', color: 'Grey', description: 'Grey Dell backpack with a laptop and sports kit' };
const lostBag = { ...base.lost, title: 'Black duffel bag', category: 'Bag', color: 'Black', description: 'Black Nike gym bag with water bottle' };
ok('different bags, same place/date => not strong', s(lostBag, laptopBag) < 70, `(${s(lostBag, laptopBag)}%)`);
const otherWallet = { ...base.found, title: 'Red coin purse', color: 'Red', description: 'Small red coin purse with hair clips', location: 'Library' };
ok('same category+location, different wallet => not strong', s(base.lost, otherWallet) < 70, `(${s(base.lost, otherWallet)}%)`);
const phone = { ...base.found, title: 'iPhone 13', category: 'Electronics', color: 'Blue', description: 'Blue iPhone with cracked screen', location: 'Canteen', eventDate: '2026-09-30' };
ok('unrelated item far away => weak', s(base.lost, phone) < 40, `(${s(base.lost, phone)}%)`);
ok('wrong-location/late wallet scores below right one', s(base.lost, { ...base.found, location: 'Hostel', eventDate: '2026-10-25' }) < D);

// Missing / malformed optional fields never crash
const bare = { type: 'found', status: 'active', id: 'X', title: 'Wallet' };
for (const [name, a, b] of [['bare vs bare', bare, bare], ['empty obj', {}, {}], ['null aiTags', { ...base.lost, aiTags: null }, base.found],
  ['nested/str tags', { ...base.lost, aiTags: [['a', 'b'], undefined, 'c'] }, { ...base.found, aiTags: 'black wallet' }],
  ['bad dates', { ...base.lost, eventDate: 'zzz', createdAt: 'zzz' }, base.found], ['undefined args', undefined, undefined]]) {
  const r = computeMatchScore(a, b);
  ok(`no crash: ${name}`, Number.isFinite(r.overall) && r.overall >= 0 && r.overall <= 100 && Array.isArray(r.breakdown), `(${r.overall}%)`);
}
ok('no signals => 0, not NaN', computeMatchScore({}, {}).overall === 0);
ok('missing location does not zero the score', s({ ...base.lost, location: '' }, base.found) >= 70);
ok('missing brand not penalised', s({ ...base.lost, brand: '' }, { ...base.found, brand: 'Hidesign' }) === s(base.lost, { ...base.found, brand: 'Hidesign' }));
ok('conflicting brands lower the score', s({ ...base.lost, brand: 'Wildcraft' }, { ...base.found, brand: 'Hidesign' }) < s({ ...base.lost, brand: 'Hidesign' }, { ...base.found, brand: 'Hidesign' }));

// Direction: LOST <-> FOUND only
const L2 = { ...base.lost, id: 'L2' }, F2 = { ...base.found, id: 'F3' };
ok('lost source ignores other lost', findMatches(base.lost, [L2]).length === 0);
ok('found source ignores other found', findMatches(base.found, [F2]).length === 0);
ok('found source matches lost', findMatches(base.found, [base.lost]).length === 1);
ok('non-active candidates skipped', findMatches(base.lost, [{ ...base.found, status: 'claimed' }]).length === 0);
ok('self excluded', findMatches(base.lost, [base.lost]).length === 0);

// Breakdown shape used by MatchScoreModal / MatchCard unchanged
const r = computeMatchScore(base.lost, base.found);
ok('breakdown rows have label/value/weight', r.breakdown.every((x) => x.label && Number.isFinite(x.value) && Number.isFinite(x.weight)));
ok('no photo-tag row when no image on either side', !r.breakdown.some((x) => x.label === 'Photo-tag similarity'));
ok('photo-tag row appears when image analysed', computeMatchScore(lostImg, base.found).breakdown.some((x) => x.label === 'Photo-tag similarity'));

// Existing behaviour for reports with images: compare with the old implementation
const old = await import('/tmp/matching_old.mjs');
ok('title-only reports are not a strong match', s(bare, bare) < 70, `(${s(bare, bare)}%)`);
console.log('\nOld vs new for the four image situations:');
for (const [k, a, b] of [['A', lostImg, foundImg], ['B', lostImg, base.found], ['C', base.lost, foundImg], ['D', base.lost, base.found]]) console.log(`  ${k}: old=${old.computeMatchScore(a, b).overall}%  new=${s(a, b)}%`);
const imgPairs = [[lostImg, foundImg], [lostBag, laptopBag], [base.lost, phone]];
console.log('\nOld vs new (image-bearing / existing pairs):');
for (const [a, b] of imgPairs) console.log(`  old=${old.computeMatchScore(a, b).overall}%  new=${s(a, b)}%  (${a.title} ↔ ${b.title})`);
ok('image pair strong match preserved (>= old)', s(lostImg, foundImg) >= old.computeMatchScore(lostImg, foundImg).overall);
console.log(`\n${n} checks passed`);
