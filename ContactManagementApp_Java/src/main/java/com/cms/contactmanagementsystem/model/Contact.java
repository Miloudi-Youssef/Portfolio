package com.cms.contactmanagementsystem.model;

import lombok.*;

@RequiredArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Contact {
    private Long id;
    private String firstName;
    private String lastName;
    private String emailAddress;
    private String mobile;
    private String office;
}
