/**
 * Property Card
 * Used in:
 * Home
 * Listing
 * Similar Properties
 * Recently Viewed
 */
export const PROPERTY_CARD_FIELDS = `
id,
slug,
title,
city,
locality,
listing_entity,
transaction_type,
property_category,
property_type,
available_property_types,
available_configurations,
bedrooms,
bathrooms,
is_featured,
price,
min_price,
max_price,
min_area,
max_area,
builtup_area,
carpet_area,
plot_area,
rera_number,
possession_status,
possession_month,
possession_year
`;

/**
 * Property Detail
 * Used in:
 * Property Detail Page
 */
export const PROPERTY_DETAIL_FIELDS = `
id,
slug,
sku,
title,
description,

user_id,

address,
city,
locality,
state,
pincode,

latitude,
longitude,
map_coordinates,

listing_entity,
transaction_type,
property_category,
property_type,
available_property_types,

configuration,
available_configurations,

project_name,
builder_name,

rera_number,
rera_website,

price,
price_per_sqft,
min_price,
max_price,

min_area,
max_area,
builtup_area,
carpet_area,
plot_area,

bedrooms,
bathrooms,
balconies,

super_builtup_area,
super_built_up_area,
floor_number,
total_floors,
facing,
furnishing_status,
ownership_type,

parking,
parking_count,
parking_spaces,

total_units,
total_towers,

possession_status,
possession_month,
possession_year,

amenities,

video_url,
virtual_tour_url,

landmarks,

is_featured,

created_at
`;

/**
 * Property Filters
 */
export const PROPERTY_FILTER_FIELDS = `
city,
locality,
listing_entity,
transaction_type,
property_category,
property_type,
configuration
`;          