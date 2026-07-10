"use client";

import { Check, Loader2, Radio, Search, Send, Signal, Sparkles, Ticket, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import { echoTicketAbi, echoTicketAddress, hasEchoTicketAddress } from "@/lib/echo-ticket";

const CHANNELS = ["AM 84", "FM 21", "BASE", "NIGHT", "LOCAL"] as const;
const TONES = ["Clear", "Warm", "Static", "Bright"] as const;
const MAX_TITLE_LENGTH = 48;
const MAX_MESSAGE_LENGTH = 140;

const PRESETS = [
  { title: "Midnight Signal", channel: "NIGHT", tone: "Warm", messageText: "A short broadcast for the tiny update that should not disappear." },
  { title: "Builder Request", channel: "BASE", tone: "Clear", messageText: "A clean ticket for one useful ask, sent with wallet and time." },
  { title: "Static Note", channel: "AM 84", tone: "Static", messageText: "A fuzzy little message that still deserves a durable record." },
] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid title")) return "Title needs 1 to 48 characters.";
  if (error.message.includes("Invalid channel")) return "Choose a channel.";
  if (error.message.includes("Invalid tone")) return "Choose a tone.";
  if (error.message.includes("Invalid message")) return "Message needs 1 to 140 characters.";
  return error.message;
}

function TicketPreview({
  title,
  channel,
  tone,
  messageText,
  sender,
  createdAt,
}: {
  title: string;
  channel: string;
  tone: string;
  messageText: string;
  sender?: Address;
  createdAt?: bigint;
}) {
  return (
    <article className={`echo-card tone-${tone.toLowerCase()}`}>
      <div className="frequency" />
      <div className="radio-dial"><Radio /></div>
      <div className="ticket-paper">
        <span>{channel || "Channel"} / {tone || "Tone"}</span>
        <h2>{title || "Untitled ticket"}</h2>
        <p>{messageText || "Send a small radio ticket on Base."}</p>
      </div>
      <footer>
        <div><span>Sender</span><strong>{shortAddress(sender)}</strong></div>
        <div><span>Sent</span><strong>{formatDate(createdAt)}</strong></div>
      </footer>
    </article>
  );
}

export function EchoTicketApp() {
  const [ticketIdInput, setTicketIdInput] = useState("1");
  const [title, setTitle] = useState<string>(PRESETS[0].title);
  const [channel, setChannel] = useState<string>(PRESETS[0].channel);
  const [tone, setTone] = useState<string>(PRESETS[0].tone);
  const [messageText, setMessageText] = useState<string>(PRESETS[0].messageText);
  const [message, setMessage] = useState("Send a small radio-style ticket on Base.");
  const [lastAction, setLastAction] = useState<"send" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });
  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedTicketId = BigInt(Math.max(1, Number(ticketIdInput || "1")));

  const ticketQuery = useReadContract({
    abi: echoTicketAbi,
    address: echoTicketAddress,
    functionName: "getTicket",
    args: [parsedTicketId],
    query: { enabled: hasEchoTicketAddress, refetchInterval: 12000 },
  });
  const totalQuery = useReadContract({
    abi: echoTicketAbi,
    address: echoTicketAddress,
    functionName: "nextTicketId",
    query: { enabled: hasEchoTicketAddress, refetchInterval: 12000 },
  });

  const tuple = ticketQuery.data as readonly [Address, string, string, string, string, bigint] | undefined;
  const liveTicket = useMemo(
    () =>
      tuple
        ? { sender: tuple[0], title: tuple[1], channel: tuple[2], tone: tuple[3], messageText: tuple[4], createdAt: tuple[5] }
        : undefined,
    [tuple],
  );

  const totalTickets = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    title.trim().length > 0 &&
    title.trim().length <= MAX_TITLE_LENGTH &&
    channel.trim().length > 0 &&
    tone.trim().length > 0 &&
    messageText.trim().length > 0 &&
    messageText.trim().length <= MAX_MESSAGE_LENGTH;
  const sendBlocker = !hasEchoTicketAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_ECHO_TICKET_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill title, channel, tone, and message."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "send") return;
    void totalQuery.refetch();
    void ticketQuery.refetch();
    const logs = parseEventLogs({ abi: echoTicketAbi, logs: receipt.logs, eventName: "TicketSent" });
    const ticketId = logs[0]?.args.ticketId;
    window.setTimeout(() => {
      if (ticketId) setTicketIdInput(ticketId.toString());
      setMessage(ticketId ? `Echo ticket #${ticketId.toString()} sent on Base.` : "Echo ticket sent on Base.");
    }, 0);
  }, [lastAction, receipt, ticketQuery, totalQuery]);

  async function connectWallet() {
    const queue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, list) => list.findIndex((entry) => entry.id === connector.id) === index);
    if (!queue.length) {
      setMessage("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }
    let lastError: unknown;
    setMessage("Opening wallet connection...");
    for (const connector of queue) {
      try {
        await connectAsync({ connector });
        setMessage("Wallet connected. Send the ticket when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setMessage(friendlyError(lastError));
  }

  async function sendTicket() {
    if (sendBlocker) {
      setMessage(sendBlocker);
      return;
    }
    if (!echoTicketAddress) return;
    try {
      setLastAction("send");
      setMessage("Confirm the echo ticket in your wallet.");
      await writeContractAsync({
        address: echoTicketAddress,
        abi: echoTicketAbi,
        functionName: "sendTicket",
        args: [title.trim(), channel.trim(), tone.trim(), messageText.trim()],
        chainId: base.id,
      });
      setMessage("Echo ticket sent to Base. Waiting for confirmation...");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    setTitle(preset.title);
    setChannel(preset.channel);
    setTone(preset.tone);
    setMessageText(preset.messageText);
  }

  return (
    <main className="echo-shell">
      <section className="echo-hero">
        <div>
          <span>Echo Ticket</span>
          <h1>Send a signal ticket on Base.</h1>
          <p>A radio-style message with channel, tone, wallet, and time.</p>
        </div>
        <aside>
          <Signal />
          <strong>{totalTickets}</strong>
          <span>tickets</span>
        </aside>
      </section>

      <section className="echo-grid">
        <div className="echo-controls">
          <div className="echo-head">
            <Ticket />
            <div><span>Broadcast desk</span><strong>{isConnected ? shortAddress(address) : "Connect to send"}</strong></div>
          </div>

          <div className="preset-strip">
            {PRESETS.map((preset, index) => (
              <button key={preset.title} type="button" onClick={() => applyPreset(index)}>{preset.title}</button>
            ))}
          </div>

          <label><span>Title</span><input value={title} maxLength={MAX_TITLE_LENGTH} onChange={(event) => setTitle(event.target.value)} /></label>
          <label><span>Message</span><textarea value={messageText} maxLength={MAX_MESSAGE_LENGTH} onChange={(event) => setMessageText(event.target.value)} /></label>

          <div className="choice-row channel-row">
            {CHANNELS.map((entry) => (
              <button key={entry} className={channel === entry ? "active" : ""} type="button" onClick={() => setChannel(entry)}>
                {channel === entry ? <Check /> : null}{entry}
              </button>
            ))}
          </div>
          <div className="choice-row tone-row">
            {TONES.map((entry) => (
              <button key={entry} className={tone === entry ? "active" : ""} type="button" onClick={() => setTone(entry)}>{entry}</button>
            ))}
          </div>

          <div className="echo-actions">
            {!isConnected ? (
              <button className="connect" disabled={connecting} onClick={connectWallet}>{connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Connect wallet</button>
            ) : chainId !== base.id ? (
              <button className="connect" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>{switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Switch to Base</button>
            ) : (
              <button className="disconnect" onClick={disconnectWallet}>{shortAddress(address)}</button>
            )}
            <button className="send" disabled={writing || confirming} onClick={sendTicket}>{writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send ticket</button>
          </div>
          <p className="message">{message}</p>
        </div>

        <div className="echo-output">
          <TicketPreview
            title={liveTicket?.title || title}
            channel={liveTicket?.channel || channel}
            tone={liveTicket?.tone || tone}
            messageText={liveTicket?.messageText || messageText}
            sender={liveTicket?.sender}
            createdAt={liveTicket?.createdAt}
          />
          <section className="lookup">
            <div><Search /><h2>Load ticket</h2></div>
            <label><span>Ticket ID</span><input value={ticketIdInput} onChange={(event) => setTicketIdInput(event.target.value.replace(/\D/g, ""))} /></label>
          </section>
          <section className="about"><Sparkles /><strong>Echo Ticket sends a radio-style message on Base with channel, tone, wallet, and time.</strong></section>
        </div>
      </section>
    </main>
  );
}
