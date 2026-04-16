-- Product Reviews Table
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES coffee_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id) -- One review per user per product
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);

-- Enable RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view product reviews" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON product_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON product_reviews FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all reviews" ON product_reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Function to update product review count and average rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  product_id_val UUID;
BEGIN
  -- Determine product_id based on operation type
  IF TG_OP = 'DELETE' THEN
    product_id_val := OLD.product_id;
  ELSE
    product_id_val := NEW.product_id;
  END IF;

  UPDATE coffee_products
  SET 
    average_rating = (SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_id = product_id_val),
    review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = product_id_val)
  WHERE id = product_id_val;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update product rating on review insert/update/delete
CREATE TRIGGER update_product_rating_after_insert
AFTER INSERT ON product_reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER update_product_rating_after_update
AFTER UPDATE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER update_product_rating_after_delete
AFTER DELETE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();
