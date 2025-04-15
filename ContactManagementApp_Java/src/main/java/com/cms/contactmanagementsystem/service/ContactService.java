package com.cms.contactmanagementsystem.service;

import com.cms.contactmanagementsystem.model.Contact;

import java.util.List;
import java.util.UUID;


public interface ContactService {
    Contact saveContact(Contact contact);
    List<Contact> fetchAllContacts();

    Contact fetchContactById(Long id);

    boolean deleteContact(Long id);

    Contact updateContact(Long id, Contact contact);
}
