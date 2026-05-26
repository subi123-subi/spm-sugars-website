INSERT INTO business_settings (
  id,
  business_name,
  whatsapp_number,
  gpay_number,
  upi_id,
  instagram_url,
  location_text,
  map_url
) VALUES (
  1,
  'SPM Sugars',
  '916374671116',
  '6374671116',
  'subiksha1403@okhdfcbank',
  'https://www.instagram.com/',
  'Erode, Tamil Nadu, India',
  'https://www.google.com/maps/search/?api=1&query=Erode%2C%20Tamil%20Nadu%2C%20India'
);

INSERT INTO products (id, name, size, price, active) VALUES
  ('jaggery-1kg', 'Jaggery (Vellam)', '1 kg', 60, 1),
  ('jaggery-5kg', 'Jaggery (Vellam)', '5 kg', 300, 1),
  ('juice-250ml', 'Sugarcane Juice', '250 ml', 50, 1),
  ('juice-1l', 'Sugarcane Juice', '1 Litre', 130, 1),
  ('powder-500g', 'Sugarcane Powder', '500 g', 60, 1),
  ('powder-1kg', 'Sugarcane Powder', '1 kg', 300, 1);
