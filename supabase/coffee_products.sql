-- Create coffee_products table
CREATE TABLE IF NOT EXISTS coffee_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('beans', 'equipment', 'accessories')),
  roastery_id UUID REFERENCES roasteries(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  specifications JSONB DEFAULT '{}',
  external_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_coffee_products_category ON coffee_products(category);
CREATE INDEX IF NOT EXISTS idx_coffee_products_roastery_id ON coffee_products(roastery_id);

-- Enable RLS
ALTER TABLE coffee_products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view coffee products"
  ON coffee_products FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert coffee products"
  ON coffee_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update coffee products"
  ON coffee_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete coffee products"
  ON coffee_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coffee_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER coffee_products_updated_at
  BEFORE UPDATE ON coffee_products
  FOR EACH ROW
  EXECUTE FUNCTION update_coffee_products_updated_at();

-- Insert sample data
INSERT INTO coffee_products (name, category, roastery_id, price, description, images, in_stock, average_rating, review_count, specifications, external_link) VALUES
('Ethiopian Yirgacheffe Grade 1', 'beans', NULL, 24.99, 'Bright and fruity with notes of blueberry and citrus. Perfect for pour-over brewing.', ARRAY['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500'], true, 4.5, 12, '{"origin": "Ethiopia", "region": "Yirgacheffe", "process": "washed", "roast": "light", "weight": "250g"}', 'https://shopee.com'),
('Colombia Huila Medium Roast', 'beans', NULL, 18.99, 'Balanced and smooth with caramel sweetness and nutty undertones. Great for espresso.', ARRAY['https://images.unsplash.com/photo-1610632380989-680fe40816c6?w=500'], true, 4.2, 8, '{"origin": "Colombia", "region": "Huila", "process": "washed", "roast": "medium", "weight": "500g"}', 'https://shopee.com'),
('Baratza Encore Conical Burr Grinder', 'equipment', NULL, 149.00, 'Entry-level burr grinder perfect for home brewing. 40 grind settings for precise control.', ARRAY['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500'], true, 4.7, 25, '{"brand": "Baratza", "type": "burr grinder", "settings": "40", "capacity": "8oz", "warranty": "1 year"}', 'https://shopee.com'),
('Hario V60 Dripper Ceramic', 'equipment', NULL, 22.00, 'Classic pour-over dripper with spiral ridges for optimal extraction.', ARRAY['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500'], true, 4.8, 34, '{"brand": "Hario", "type": "pour-over", "material": "ceramic", "size": "02", "capacity": "1-4 cups"}', 'https://shopee.com'),
('Fellow Stagg EKG Electric Kettle', 'equipment', NULL, 165.00, 'Precision electric kettle with variable temperature control and gooseneck spout.', ARRAY['https://images.unsplash.com/photo-1597481499723-2e8e3f8e5f9c?w=500'], true, 4.9, 18, '{"brand": "Fellow", "type": "electric kettle", "capacity": "0.9L", "temperature_range": "135-212°F", "display": "LCD"}', 'https://shopee.com'),
('Coffee Scale with Timer', 'accessories', NULL, 45.00, 'Digital scale with built-in timer for precise brewing measurements.', ARRAY['https://images.unsplash.com/photo-1585535119683-6b4c3c5b7c3b?w=500'], true, 4.4, 12, '{"capacity": "2kg", "precision": "0.1g", "timer": "yes", "battery": "AAA x 2"}', 'https://shopee.com'),
('Chemex Glass Coffeemaker', 'equipment', NULL, 45.00, 'Elegant glass pour-over brewer for clean, bright coffee.', ARRAY['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500'], true, 4.6, 28, '{"brand": "Chemex", "type": "pour-over", "material": "borosilicate glass", "capacity": "6 cups"}', 'https://shopee.com');
