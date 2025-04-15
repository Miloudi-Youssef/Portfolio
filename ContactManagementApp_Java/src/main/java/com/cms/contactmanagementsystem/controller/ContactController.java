package com.cms.contactmanagementsystem.controller;

import com.cms.contactmanagementsystem.model.Contact;
import com.cms.contactmanagementsystem.service.ContactService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@SuppressWarnings("ALL")
@CrossOrigin(origins = {"http://localhost:3000"})
@RestController
@RequestMapping("cms/api/v1")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping("/saveContact")
    public Contact saveContact(@RequestBody Contact contact) {
        return contactService.saveContact(contact);
    }

    @GetMapping("/fetchContacts")
    public List<Contact> fetchAllContacts() {
        return contactService.fetchAllContacts();
    }

    @GetMapping("/fetchUserById/{id}")
    public ResponseEntity<Contact> fetchContactById(@PathVariable("id") Long id) {
        Contact contact =  contactService.fetchContactById(id);
        return ResponseEntity.ok(contact);
    }

    @DeleteMapping("/deleteContactBy/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteContact(@PathVariable("id") Long id) {
        boolean deleted = false;
        deleted = contactService.deleteContact(id);
        Map<String,Boolean > response = new HashMap<>();
        response.put("Contact deleted successfully", deleted = true);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/updateContact/{id}")
    public ResponseEntity<Contact> updateContact(@PathVariable("id") Long id, @RequestBody Contact contact){
        contact = contactService.updateContact(id, contact);
        return ResponseEntity.ok(contact);
    }

//    @GetMapping("/fetchContactsAsCSV")
//    public ResponseEntity<>
}