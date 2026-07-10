import { parseAbi } from "viem";

export const echoTicketAddress = process.env.NEXT_PUBLIC_ECHO_TICKET_CONTRACT_ADDRESS as
  | `0x${string}`
  | undefined;

export const hasEchoTicketAddress =
  Boolean(echoTicketAddress) && !echoTicketAddress?.includes("replace_with");

export const echoTicketAbi = parseAbi([
  "event TicketSent(uint256 indexed ticketId,address indexed sender,string title,string channel)",
  "function nextTicketId() view returns (uint256)",
  "function sendTicket(string title,string channel,string tone,string messageText) returns (uint256)",
  "function getTicket(uint256 ticketId) view returns (address sender,string title,string channel,string tone,string messageText,uint256 createdAt)",
]);
