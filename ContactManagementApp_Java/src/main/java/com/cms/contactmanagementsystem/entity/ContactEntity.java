package com.cms.contactmanagementsystem.entity;

import lombok.*;

import javax.persistence.*;

@Data
@Entity
@Table(name = "Contacts")
public class ContactEntity {
    @javax.persistence.Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String firstName;
    private String lastName;
    private String emailAddress;
    private String mobile;
    private String office;
}
