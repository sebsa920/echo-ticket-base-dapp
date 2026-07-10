import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const outDir = resolve(process.cwd(), "base-submission");
await mkdir(outDir, { recursive: true });

const c = {
  night: "#080c12",
  ink: "#111418",
  paper: "#f4e5bf",
  paper2: "#f9eed0",
  amber: "#f0a83a",
  red: "#d84c36",
  teal: "#54c6bd",
  blue: "#254d6d",
  mint: "#b7e3cf",
};

const esc = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const t = (x, y, value, size, fill = c.paper, weight = 900, anchor = "start") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(value)}</text>`;
const multiline = (x, y, text, size, fill = c.paper, weight = 900, gap = size * 1.04) =>
  `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${text
    .split("\n")
    .map((line, i) => `<tspan x="${x}" dy="${i ? gap : 0}">${esc(line)}</tspan>`)
    .join("")}</text>`;

const defs = () => `<defs>
  <filter id="shadow"><feDropShadow dx="0" dy="22" stdDeviation="18" flood-color="#000" flood-opacity=".36"/></filter>
  <pattern id="scan" width="1284" height="18" patternUnits="userSpaceOnUse"><path d="M0 17H1284" stroke="#f4e5bf" stroke-width="1" opacity=".06"/></pattern>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.4" fill="#f4e5bf" opacity=".13"/></pattern>
</defs>`;

function meter(x, y, w, active = 0.64) {
  const ticks = Array.from({ length: 17 }, (_, i) => {
    const tx = x + 34 + i * ((w - 68) / 16);
    const tall = i % 4 === 0;
    return `<path d="M${tx} ${y + 96}V${y + (tall ? 44 : 64)}" stroke="${c.paper}" stroke-width="${tall ? 5 : 3}" opacity="${tall ? ".92" : ".48"}"/>`;
  }).join("");
  return `<g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="140" rx="0" fill="#121923" stroke="${c.paper}" stroke-opacity=".18" stroke-width="3"/>
    <rect x="${x + 24}" y="${y + 24}" width="${w - 48}" height="92" fill="#091016" stroke="${c.teal}" stroke-opacity=".34" stroke-width="2"/>
    ${ticks}
    <circle cx="${x + 34 + (w - 68) * active}" cy="${y + 96}" r="18" fill="${c.red}" stroke="${c.paper}" stroke-width="4"/>
  </g>`;
}

function radioTicket({ x, y, title, channel, tone, body, sender = "--", date = "--", color = c.amber }) {
  return `<g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="1080" height="1080" fill="#101722" stroke="${c.paper}" stroke-opacity=".2" stroke-width="3"/>
    <rect x="${x}" y="${y}" width="1080" height="1080" fill="url(#dots)"/>
    <circle cx="${x + 180}" cy="${y + 174}" r="86" fill="none" stroke="${color}" stroke-width="16"/>
    <circle cx="${x + 180}" cy="${y + 174}" r="30" fill="${color}"/>
    <path d="M${x + 310} ${y + 128}H${x + 950}M${x + 310} ${y + 174}H${x + 870}M${x + 310} ${y + 220}H${x + 980}" stroke="${c.paper}" stroke-width="10" stroke-linecap="square" opacity=".78"/>
    ${meter(x + 90, y + 332, 900, tone === "Static" ? 0.82 : tone === "Bright" ? 0.7 : 0.48)}
    <rect x="${x + 118}" y="${y + 548}" width="844" height="360" fill="${c.paper2}" stroke="${color}" stroke-width="9"/>
    <path d="M${x + 118} ${y + 622}H${x + 962}" stroke="${c.ink}" stroke-width="3" opacity=".22"/>
    ${t(x + 152, y + 604, `${channel} / ${tone}`, 28, c.blue, 950)}
    ${multiline(x + 152, y + 724, title, 68, c.ink, 950, 70)}
    ${multiline(x + 152, y + 850, body, 30, c.ink, 850, 38)}
    <rect x="${x + 118}" y="${y + 948}" width="404" height="78" fill="rgba(244,229,191,.1)" stroke="${c.paper}" stroke-opacity=".18"/>
    <rect x="${x + 558}" y="${y + 948}" width="404" height="78" fill="rgba(244,229,191,.1)" stroke="${c.paper}" stroke-opacity=".18"/>
    ${t(x + 146, y + 980, "SENDER", 18, "rgba(244,229,191,.58)", 950)}
    ${t(x + 146, y + 1008, sender, 28, c.paper, 950)}
    ${t(x + 586, y + 980, "TIME", 18, "rgba(244,229,191,.58)", 950)}
    ${t(x + 586, y + 1008, date, 28, c.paper, 950)}
  </g>`;
}

function infoBox(x, y, w, h, label, value, color = c.paper) {
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(244,229,191,.08)" stroke="${color}" stroke-opacity=".35" stroke-width="3"/>
    ${t(x + 28, y + 48, label, 20, "rgba(244,229,191,.62)", 950)}
    ${multiline(x + 28, y + 112, value, 38, c.paper, 950, 43)}
  </g>`;
}

const frame = (body) => `<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">${defs()}
  <rect width="1284" height="2778" fill="${c.night}"/>
  <rect width="1284" height="2778" fill="url(#scan)"/>
  <circle cx="1070" cy="180" r="320" fill="${c.teal}" opacity=".14"/>
  <circle cx="126" cy="2328" r="330" fill="${c.red}" opacity=".10"/>
  ${body}
</svg>`;

const headline = (a, b) => `${t(92, 152, "Echo Ticket", 62, c.paper, 950)}${multiline(96, 284, a, 82, c.paper, 950, 83)}${t(102, 438, b, 31, "rgba(244,229,191,.76)", 850)}`;

const shot1 = frame(`${headline("Send a\nsignal.", "Channel, tone, wallet, and time on Base.")}
  ${radioTicket({ x: 102, y: 570, title: "Midnight\nSignal", channel: "NIGHT", tone: "Warm", body: "A short broadcast for the tiny update\nthat should not disappear.", color: c.amber })}
  ${infoBox(102, 1778, 500, 250, "1 TUNE", "Pick channel\nand tone.", c.teal)}
  ${infoBox(682, 1778, 500, 250, "2 SEND", "Stamp ticket\non Base.", c.amber)}
  ${infoBox(102, 2110, 1080, 286, "WHAT IT DOES", "Echo Ticket turns one short message\ninto a radio-style onchain ticket.", c.red)}`);

const shot2 = frame(`${headline("Tune the\nbroadcast.", "Choose a preset or write your own.")}
  ${meter(102, 548, 1080, 0.72)}
  ${infoBox(102, 760, 322, 170, "CHANNEL", "BASE", c.teal)}
  ${infoBox(480, 760, 322, 170, "TONE", "Clear", c.amber)}
  ${infoBox(860, 760, 322, 170, "STATUS", "Ready", c.red)}
  ${radioTicket({ x: 102, y: 1040, title: "Builder\nRequest", channel: "BASE", tone: "Clear", body: "A clean ticket for one useful ask,\nsent with wallet and time.", sender: "0x4265...af62", date: "May 20", color: c.teal })}
  ${infoBox(102, 2260, 1080, 180, "ACTION", "Connect wallet, then send ticket.", c.amber)}`);

const shot3 = frame(`${headline("Load any\nticket.", "Read a signal by ID.")}
  ${radioTicket({ x: 102, y: 590, title: "Static\nNote", channel: "AM 84", tone: "Static", body: "A fuzzy little message that still\ndeserves a durable record.", sender: "0xdD8f...5c36", date: "May 20", color: c.red })}
  ${infoBox(102, 1810, 500, 250, "LOOKUP", "Enter Ticket ID\nand load.", c.teal)}
  ${infoBox(682, 1810, 500, 250, "PROOF", "Sender, tone,\nand time.", c.amber)}
  ${infoBox(102, 2140, 1080, 286, "BROADCAST RECORD", "Keep small public signals readable\nfrom Base.", c.red)}`);

const thumb = `<svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">${defs()}
  <rect width="1910" height="1000" fill="${c.night}"/>
  <rect width="1910" height="1000" fill="url(#scan)"/>
  <circle cx="1600" cy="160" r="360" fill="${c.teal}" opacity=".14"/>
  ${t(88, 164, "Echo Ticket", 112, c.paper, 950)}
  ${t(98, 250, "Send a small radio-style ticket on Base.", 42, "rgba(244,229,191,.76)", 850)}
  ${infoBox(96, 390, 540, 210, "CHANNEL", "Tune the signal.", c.teal)}
  ${infoBox(96, 655, 540, 210, "PROOF", "Wallet and time.", c.amber)}
  ${radioTicket({ x: 752, y: 18, title: "Midnight\nSignal", channel: "NIGHT", tone: "Warm", body: "A short broadcast for the tiny update\nthat should not disappear.", sender: "0x4265...af62", date: "May 20", color: c.amber })}
</svg>`;

const icon = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${defs()}
  <rect width="1024" height="1024" fill="${c.night}"/>
  <rect width="1024" height="1024" fill="url(#scan)"/>
  <circle cx="512" cy="352" r="178" fill="none" stroke="${c.amber}" stroke-width="34"/>
  <circle cx="512" cy="352" r="68" fill="${c.amber}"/>
  <path d="M218 648H806M262 724H762M318 800H706" stroke="${c.paper}" stroke-width="42" stroke-linecap="square"/>
  <text x="512" y="925" text-anchor="middle" font-family="Arial" font-size="80" font-weight="950" fill="${c.paper}">ECHO</text>
</svg>`;

async function writePng(name, svg, width, height) {
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(join(outDir, name));
}

await writePng("screenshot-1.png", shot1, 1284, 2778);
await writePng("screenshot-2.png", shot2, 1284, 2778);
await writePng("screenshot-3.png", shot3, 1284, 2778);
await sharp(Buffer.from(thumb)).resize(1200, 628).jpeg({ quality: 88 }).toFile(join(outDir, "app-thumbnail.jpg"));
await sharp(Buffer.from(icon)).resize(1024, 1024).jpeg({ quality: 90 }).toFile(join(outDir, "app-icon.jpg"));
await writeFile(join(outDir, "submission-copy.md"), `# Echo Ticket

App Name: Echo Ticket
Tagline: Send a signal
Description: Send a small radio-style ticket with channel, tone, wallet, and time on Base.

Screenshots:
- screenshot-1.png: default first screen, showing the radio ticket concept.
- screenshot-2.png: interaction state, showing channel and tone selection.
- screenshot-3.png: result/lookup state, showing a loaded ticket by ID.
`, "utf8");
await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  assets: ["app-icon.jpg", "app-thumbnail.jpg", "screenshot-1.png", "screenshot-2.png", "screenshot-3.png", "submission-copy.md"].map((name) => join(outDir, name)),
}, null, 2), "utf8");
