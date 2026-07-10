// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EchoTicket {
    uint256 public nextTicketId = 1;

    struct Ticket {
        address sender;
        string title;
        string channel;
        string tone;
        string messageText;
        uint256 createdAt;
    }

    mapping(uint256 => Ticket) private tickets;

    event TicketSent(uint256 indexed ticketId, address indexed sender, string title, string channel);

    function sendTicket(
        string calldata title,
        string calldata channel,
        string calldata tone,
        string calldata messageText
    ) external returns (uint256 ticketId) {
        require(bytes(title).length > 0 && bytes(title).length <= 48, "Invalid title");
        require(bytes(channel).length > 0 && bytes(channel).length <= 24, "Invalid channel");
        require(bytes(tone).length > 0 && bytes(tone).length <= 24, "Invalid tone");
        require(bytes(messageText).length > 0 && bytes(messageText).length <= 140, "Invalid message");

        ticketId = nextTicketId++;
        tickets[ticketId] = Ticket({
            sender: msg.sender,
            title: title,
            channel: channel,
            tone: tone,
            messageText: messageText,
            createdAt: block.timestamp
        });

        emit TicketSent(ticketId, msg.sender, title, channel);
    }

    function getTicket(
        uint256 ticketId
    )
        external
        view
        returns (
            address sender,
            string memory title,
            string memory channel,
            string memory tone,
            string memory messageText,
            uint256 createdAt
        )
    {
        Ticket storage ticket = tickets[ticketId];
        return (ticket.sender, ticket.title, ticket.channel, ticket.tone, ticket.messageText, ticket.createdAt);
    }
}
