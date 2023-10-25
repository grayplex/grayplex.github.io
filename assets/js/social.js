const socialList = document.createElement('ul');
socialList.className = 'nav col-md-8 justify-content-end list-unstyled d-flex';

socialLinks.forEach(link => {
    const listItem = document.createElement('li');
    listItem.className = 'ms-3';

    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.className = 'mx-2';

    const icon = document.createElement('iconify-icon');
    icon.setAttribute('inline', '');
    icon.className = 'social-icon';
    icon.setAttribute('icon', link.icon);

    anchor.appendChild(icon);
    listItem.appendChild(anchor);
    socialList.appendChild(listItem);
});

document.body.appendChild(socialList);