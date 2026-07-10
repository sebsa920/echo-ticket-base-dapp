import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import solc from "solc";
import { createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const envText = await readFile(resolve(process.cwd(), ".env.local"), "utf8").catch(() => "");
function getEnv(name) {
  const shellValue = process.env[name];
  if (shellValue) return shellValue;
  return envText.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim();
}

const privateKey = getEnv("DEPLOYER_PRIVATE_KEY");
const rpcUrl = getEnv("BASE_RPC_URL") ?? "https://mainnet.base.org";
if (!privateKey || privateKey.includes("replace_with")) {
  throw new Error("Missing DEPLOYER_PRIVATE_KEY in .env.local or shell env.");
}

const source = await readFile(resolve(process.cwd(), "contracts/EchoTicket.sol"), "utf8");
const input = {
  language: "Solidity",
  sources: { "EchoTicket.sol": { content: source } },
  settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const contract = output.contracts?.["EchoTicket.sol"]?.EchoTicket;
if (!contract) {
  console.error(output.errors?.map((error) => error.formattedMessage).join("\n") ?? "");
  throw new Error("Solidity compile failed.");
}

const account = privateKeyToAccount(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
const base = defineChain({
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: { default: { name: "BaseScan", url: "https://basescan.org" } },
});
const publicClient = createPublicClient({ chain: base, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain: base, transport: http(rpcUrl) });

console.log(`Deploying EchoTicket from ${account.address} on Base...`);
const hash = await walletClient.deployContract({
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
});
const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log(`Transaction: https://basescan.org/tx/${hash}`);
console.log(`Contract: ${receipt.contractAddress}`);
console.log("Set NEXT_PUBLIC_ECHO_TICKET_CONTRACT_ADDRESS to this contract address in Vercel.");
