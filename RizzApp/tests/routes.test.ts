import { readdirSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { protectedScreens, routeAccess } from '../services/routePolicy';
it('keeps every business route behind a guard and makes new unclassified routes fail CI', () => {
  const routes = readdirSync('app', { withFileTypes: true }).filter(entry => entry.isDirectory() || /\.tsx$/.test(entry.name)).map(entry => entry.name.replace(/\.tsx$/, ''));
  expect(routes.sort()).toEqual(['_layout', 'index', '(auth)', ...protectedScreens].sort());
});
it('keeps private screens unmounted during loading, failure, and logout', () => {
  expect(routeAccess(true, false, false)).toEqual({ public: false, private: true });
  expect(routeAccess(false, false, false)).toEqual({ public: true, private: false });
  expect(routeAccess(false, true, false)).toEqual({ public: true, private: false });
  expect(routeAccess(true, true, false)).toEqual({ public: false, private: false });
  expect(routeAccess(true, false, true)).toEqual({ public: false, private: false });
});
it('has a simulation import for every screen and navigator in the route tree', () => {
  const routes = readdirSync('app', {recursive:true}).map(String).filter(name => name.endsWith('.tsx')).map(name => name.replaceAll('\\','/').replace(/\.tsx$/, ''));
  const testSource = readdirSync('tests').filter(name => name.endsWith('.test.ts')).map(name => readFileSync('tests/' + name, 'utf8')).join('\n');
  const imports = new Set(Array.from(testSource.matchAll(/['"]\.\.\/app\/([^'"]+)['"]/g), match => match[1]));
  expect(routes.filter(route => !imports.has(route))).toEqual([]);
});
