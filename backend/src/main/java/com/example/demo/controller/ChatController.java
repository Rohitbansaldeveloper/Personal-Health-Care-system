package com.example.demo.controller;

import com.example.demo.dto.ChatMessageDTO;
import com.example.demo.model.ChatMessage;
import com.example.demo.model.User;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private ChatMessageRepository chatRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/{user1}/{user2}")
    public ResponseEntity<List<ChatMessage>> getConversation(@PathVariable Long user1, @PathVariable Long user2) {
        return ResponseEntity.ok(chatRepository.findConversation(user1, user2));
    }

    @PostMapping("/")
    public ResponseEntity<ChatMessage> sendMessage(@RequestBody ChatMessage message) {
        return ResponseEntity.ok(chatRepository.save(message));
    }

    @MessageMapping("/chat.send")
    public void processMessage(@Payload ChatMessageDTO chatMessageDTO) {
        Optional<User> senderOpt = userRepository.findById(chatMessageDTO.getSenderId());
        Optional<User> receiverOpt = userRepository.findById(chatMessageDTO.getReceiverId());

        if (senderOpt.isPresent() && receiverOpt.isPresent()) {
            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setSender(senderOpt.get());
            chatMessage.setReceiver(receiverOpt.get());
            chatMessage.setMessage(chatMessageDTO.getMessage());
            
            ChatMessage savedMessage = chatRepository.save(chatMessage);
            
            // Send to sender's queue and receiver's queue
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(chatMessageDTO.getReceiverId()), "/queue/messages", savedMessage
            );
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(chatMessageDTO.getSenderId()), "/queue/messages", savedMessage
            );
        }
    }
}
