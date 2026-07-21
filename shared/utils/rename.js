const RULE_REGEX = /\((\d+)([+-])\)/;
export const getRuleString = (out) => {
    const m = out.match(/\((.+?)\)/);
    return m ? m[1] : null;
};
export const buildRule = (rule) => {
    const m = rule.match(/^(\d+)([+-])$/);
    if (!m)
        return null;
    const init = Number(m[1]);
    const step = m[2] === '+' ? 1 : -1;
    return { init, step, len: m[1].length };
};
export const buildOuts = (uris, out) => {
    if (!out)
        return [];
    const m = out.match(RULE_REGEX);
    if (!m)
        return uris.map(() => out);
    const rule = buildRule(m[0].slice(1, -1));
    if (!rule)
        return [];
    return uris.map((_, i) => {
        const n = rule.init + rule.step * i;
        const padded = String(n).padStart(rule.len, '0');
        return out.replace(RULE_REGEX, padded);
    });
};
