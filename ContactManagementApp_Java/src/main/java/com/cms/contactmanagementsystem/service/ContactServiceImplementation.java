package com.cms.contactmanagementsystem.service;

import com.cms.contactmanagementsystem.entity.ContactEntity;
import com.cms.contactmanagementsystem.model.Contact;
import com.cms.contactmanagementsystem.repository.ContactRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContactServiceImplementation implements ContactService {

    private final ContactRepository contactRepository;

    public ContactServiceImplementation(ContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }
    @Override
    public Contact saveContact(Contact contact) {
        ContactEntity contactEntity = new ContactEntity();
        BeanUtils.copyProperties(contact, contactEntity);
        contactRepository.save(contactEntity);
        return contact;
    }

    @Override
    public List<Contact> fetchAllContacts() {
        List<ContactEntity> contactEntities = contactRepository.findAll();

        List<Contact> contacts = contactEntities
                .stream()
                .map(contactEntity -> new Contact(
                        contactEntity.getId(),
                        contactEntity.getFirstName(),
                        contactEntity.getLastName(),
                        contactEntity.getEmailAddress(),
                        contactEntity.getMobile(),
                        contactEntity.getOffice()
                )).collect(Collectors.toList());
        return contacts;
    }

    @Override
    public Contact fetchContactById(Long id) {
        ContactEntity contactEntity = contactRepository.findById(id).get();
        Contact contact = new Contact();
        BeanUtils.copyProperties(contactEntity, contact);
        return contact;
    }

    @Override
    public boolean deleteContact(Long id) {
        ContactEntity contact = contactRepository.findById(id).get();
        contactRepository.delete(contact);
        return false;
    }

    @Override
    public Contact updateContact(Long id, Contact contact) {
        ContactEntity contactEntity = contactRepository.findById(id).get();
        contactEntity.setFirstName(contact.getFirstName());
        contactEntity.setLastName(contact.getLastName());
        contactEntity.setEmailAddress(contact.getEmailAddress());
        contactEntity.setMobile(contact.getMobile());
        contactEntity.setOffice(contact.getOffice());
        contactRepository.save(contactEntity);
        return contact;
    }


}
