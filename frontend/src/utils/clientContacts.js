/** Every dialable contact on a client: primary first, then any extras. */
export function callableContacts(client) {
  if (!client) return [];
  const contacts = [];
  if (client.contactPhone) {
    contacts.push({ name: client.contactName || client.companyName, phone: client.contactPhone, isPrimary: true });
  }
  (client.additionalContacts || []).forEach((c) => {
    if (c.phone) contacts.push({ name: c.name, phone: c.phone, designation: c.designation });
  });
  return contacts;
}
