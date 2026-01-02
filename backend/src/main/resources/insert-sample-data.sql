-- =====================================================
-- SCRIPT SQL POUR INSÉRER DES DONNÉES D'EXEMPLE
-- =====================================================
-- Ce script peut être exécuté directement dans PostgreSQL
-- Il détecte automatiquement les IDs des utilisateurs existants
-- =====================================================

-- ÉTAPE 1: Vérifier et obtenir les IDs des utilisateurs
-- Le script utilise les premiers Owner et Tenant trouvés dans la base

DO $$
DECLARE
    v_owner_id BIGINT;
    v_tenant_id BIGINT;
    v_property_id BIGINT;
    v_prop1_id BIGINT;
    v_prop2_id BIGINT;
    v_prop3_id BIGINT;
    v_prop4_id BIGINT;
    v_prop5_id BIGINT;
BEGIN
    -- Récupérer l'ID du premier Owner
    SELECT id INTO v_owner_id 
    FROM users 
    WHERE role = 'OWNER' 
    ORDER BY id 
    LIMIT 1;
    
    -- Récupérer l'ID du premier Tenant
    SELECT id INTO v_tenant_id 
    FROM users 
    WHERE role = 'TENANT' 
    ORDER BY id 
    LIMIT 1;
    
    -- Vérifier si des utilisateurs existent
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Aucun Owner trouvé dans la base de données. Veuillez d''abord créer un Owner via l''API d''inscription.';
    END IF;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Aucun Tenant trouvé dans la base de données. Veuillez d''abord créer un Tenant via l''API d''inscription.';
    END IF;
    
    RAISE NOTICE 'Utilisation de Owner ID: %', v_owner_id;
    RAISE NOTICE 'Utilisation de Tenant ID: %', v_tenant_id;
    
    -- =====================================================
    -- ÉTAPE 2: Insérer les propriétés
    -- =====================================================
    
    -- Propriétés pour Casablanca
    INSERT INTO properties (title, description, price, area, region, latitude, longitude, availability, number_of_rooms, number_of_bedrooms, number_of_bathrooms, has_wifi, has_parking, has_air_conditioning, has_heating, has_furnished, pets_allowed, property_type, rental_period, owner_id, created_at, updated_at)
    VALUES 
    ('Appartement moderne à Casablanca', 'Magnifique appartement de 3 pièces situé au cœur de Casablanca, proche de tous les services. Appartement entièrement meublé avec vue sur la mer.', 4500.00, 85.5, 'Casablanca', 33.5731, -7.5898, CURRENT_DATE + INTERVAL '30 days', 3, 2, 2, true, true, true, true, true, false, 'APARTMENT', 'MONTH', v_owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id INTO v_property_id;
    
    INSERT INTO properties (title, description, price, area, region, latitude, longitude, availability, number_of_rooms, number_of_bedrooms, number_of_bathrooms, has_wifi, has_parking, has_air_conditioning, has_heating, has_furnished, pets_allowed, property_type, rental_period, owner_id, created_at, updated_at)
    VALUES 
    ('Studio cosy centre-ville', 'Studio moderne et bien équipé dans le centre de Casablanca. Idéal pour étudiant ou jeune professionnel.', 2500.00, 35.0, 'Casablanca', 33.5731, -7.5898, CURRENT_DATE + INTERVAL '15 days', 1, 1, 1, true, false, true, true, true, false, 'STUDIO', 'MONTH', v_owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    
    INSERT INTO properties (title, description, price, area, region, latitude, longitude, availability, number_of_rooms, number_of_bedrooms, number_of_bathrooms, has_wifi, has_parking, has_air_conditioning, has_heating, has_furnished, pets_allowed, property_type, rental_period, owner_id, created_at, updated_at)
    VALUES 
    ('Villa avec jardin à Casablanca', 'Superbe villa de 5 pièces avec jardin privé et piscine. Quartier résidentiel calme.', 12000.00, 200.0, 'Casablanca', 33.5731, -7.5898, CURRENT_DATE + INTERVAL '60 days', 5, 4, 3, true, true, true, true, true, true, 'HOUSE', 'MONTH', v_owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    
    -- Propriétés pour Rabat
    INSERT INTO properties (title, description, price, area, region, latitude, longitude, availability, number_of_rooms, number_of_bedrooms, number_of_bathrooms, has_wifi, has_parking, has_air_conditioning, has_heating, has_furnished, pets_allowed, property_type, rental_period, owner_id, created_at, updated_at)
    VALUES 
    ('Appartement luxueux à Rabat', 'Appartement haut de gamme de 4 pièces avec terrasse panoramique. Vue imprenable sur l''océan.', 6500.00, 120.0, 'Rabat', 34.0209, -6.8416, CURRENT_DATE + INTERVAL '45 days', 4, 3, 2, true, true, true, true, true, false, 'APARTMENT', 'MONTH', v_owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Maison traditionnelle rénovée', 'Belle maison traditionnelle marocaine rénovée avec cour intérieure. 3 chambres, 2 salles de bain.', 5500.00, 150.0, 'Rabat', 34.0209, -6.8416, CURRENT_DATE + INTERVAL '20 days', 3, 3, 2, true, true, false, true, true, false, 'HOUSE', 'MONTH', v_owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    
    -- Propriétés pour Marrakech
    INSERT INTO properties (title, description, price, area, region, latitude, longitude, availability, number_of_rooms, number_of_bedrooms, number_of_bathrooms, has_wifi, has_parking, has_air_conditioning, has_heating, has_furnished, pets_allowed, property_type, rental_period, owner_id, created_at, updated_at)
    VALUES 
    ('Riad authentique à Marrakech', 'Magnifique riad traditionnel dans la médina de Marrakech. 4 chambres avec patio central.', 8000.00, 180.0, 'Marrakech', 31.6295, -7.9811, CURRENT_DATE + INTERVAL '30 days', 4, 4, 3, true, false, true, true, true, false, 'HOUSE', 'MONTH', v_owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Appartement moderne Guéliz', 'Appartement moderne de 2 pièces dans le quartier Guéliz. Proche des commerces et restaurants.', 4000.00, 65.0, 'Marrakech', 31.6295, -7.9811, CURRENT_DATE + INTERVAL '10 days', 2, 1, 1, true, true, true, true, true, false, 'APARTMENT', 'MONTH', v_owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    
    -- Propriétés pour Tanger
    INSERT INTO properties (title, description, price, area, region, latitude, longitude, availability, number_of_rooms, number_of_bedrooms, number_of_bathrooms, has_wifi, has_parking, has_air_conditioning, has_heating, has_furnished, pets_allowed, property_type, rental_period, owner_id, created_at, updated_at)
    VALUES 
    ('Appartement vue mer Tanger', 'Superbe appartement avec vue panoramique sur le détroit de Gibraltar. 3 pièces, 2 chambres.', 5000.00, 95.0, 'Tanger', 35.7595, -5.8340, CURRENT_DATE + INTERVAL '25 days', 3, 2, 2, true, true, true, true, true, false, 'APARTMENT', 'MONTH', v_owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    
    -- Propriétés pour Fès
    INSERT INTO properties (title, description, price, area, region, latitude, longitude, availability, number_of_rooms, number_of_bedrooms, number_of_bathrooms, has_wifi, has_parking, has_air_conditioning, has_heating, has_furnished, pets_allowed, property_type, rental_period, owner_id, created_at, updated_at)
    VALUES 
    ('Maison dans la médina de Fès', 'Authentique maison dans la médina classée UNESCO. 3 chambres, cour intérieure.', 4500.00, 140.0, 'Fès', 34.0331, -5.0003, CURRENT_DATE + INTERVAL '40 days', 3, 3, 2, true, false, false, true, true, false, 'HOUSE', 'MONTH', v_owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    
    -- Propriétés pour Agadir
    INSERT INTO properties (title, description, price, area, region, latitude, longitude, availability, number_of_rooms, number_of_bedrooms, number_of_bathrooms, has_wifi, has_parking, has_air_conditioning, has_heating, has_furnished, pets_allowed, property_type, rental_period, owner_id, created_at, updated_at)
    VALUES 
    ('Villa avec piscine à Agadir', 'Villa moderne de 4 pièces avec piscine privée. Proche de la plage.', 10000.00, 220.0, 'Agadir', 30.4278, -9.5981, CURRENT_DATE + INTERVAL '50 days', 4, 3, 3, true, true, true, true, true, true, 'HOUSE', 'MONTH', v_owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Studio proche plage', 'Studio meublé à 5 minutes de la plage. Idéal pour vacances ou location longue durée.', 3000.00, 40.0, 'Agadir', 30.4278, -9.5981, CURRENT_DATE + INTERVAL '15 days', 1, 1, 1, true, false, true, false, true, false, 'STUDIO', 'MONTH', v_owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    
    RAISE NOTICE '10 propriétés insérées avec succès';
    
    -- =====================================================
    -- ÉTAPE 3: Insérer les reviews
    -- =====================================================
    -- Note: La table reviews a une contrainte unique sur (tenant_id, owner_id)
    -- Un tenant ne peut donner qu'une seule review par owner
    -- On supprime d'abord les reviews existantes pour ce couple, puis on en insère une seule
    
    -- Supprimer les reviews existantes pour ce couple tenant/owner (si elles existent)
    DELETE FROM reviews WHERE tenant_id = v_tenant_id AND owner_id = v_owner_id;
    
    -- Récupérer l'ID de la première propriété créée pour la review
    SELECT id INTO v_prop1_id FROM properties WHERE title = 'Appartement moderne à Casablanca' ORDER BY id DESC LIMIT 1;
    
    -- Insérer une seule review avec property_id
    -- (Un tenant ne peut donner qu'une review par owner selon la contrainte unique)
    -- On a déjà supprimé les reviews existantes, donc pas besoin de ON CONFLICT
    INSERT INTO reviews (rating, comment, tenant_id, owner_id, property_id, created_at, updated_at)
    VALUES 
    (5, 'Excellent propriétaire, très réactif et professionnel. La propriété correspond parfaitement à la description. Service impeccable, je recommande vivement!', v_tenant_id, v_owner_id, v_prop1_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    
    RAISE NOTICE '1 review insérée avec succès (contrainte unique: 1 review par tenant/owner)';
    
    -- =====================================================
    -- ÉTAPE 4: Insérer les commentaires de propriétés
    -- =====================================================
    -- Note: On utilise les IDs de propriétés qui viennent d'être créés
    -- Les IDs commencent à partir du dernier ID de propriété existant + 1
    
    INSERT INTO property_comments (rating, comment, property_id, user_id, created_at, updated_at)
    SELECT 
        5, 'Superbe appartement, très bien situé et entièrement équipé! 🌟', p.id, v_tenant_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM properties p 
    WHERE p.region = 'Casablanca' AND p.title = 'Appartement moderne à Casablanca'
    ORDER BY p.id DESC LIMIT 1;
    
    INSERT INTO property_comments (rating, comment, property_id, user_id, created_at, updated_at)
    SELECT 
        4, 'Très bon rapport qualité-prix. Quartier calme et agréable.', p.id, v_tenant_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM properties p 
    WHERE p.region = 'Casablanca' AND p.title = 'Appartement moderne à Casablanca'
    ORDER BY p.id DESC LIMIT 1;
    
    INSERT INTO property_comments (rating, comment, property_id, user_id, created_at, updated_at)
    SELECT 
        5, 'Parfait pour un séjour à Casablanca. Je recommande vivement!', p.id, v_tenant_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM properties p 
    WHERE p.region = 'Casablanca' AND p.title = 'Studio cosy centre-ville'
    ORDER BY p.id DESC LIMIT 1;
    
    INSERT INTO property_comments (rating, comment, property_id, user_id, created_at, updated_at)
    SELECT 
        5, 'Villa magnifique avec un jardin exceptionnel. Séjour inoubliable!', p.id, v_tenant_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM properties p 
    WHERE p.region = 'Casablanca' AND p.title = 'Villa avec jardin à Casablanca'
    ORDER BY p.id DESC LIMIT 1;
    
    INSERT INTO property_comments (rating, comment, property_id, user_id, created_at, updated_at)
    SELECT 
        4, 'Belle propriété, bien entretenue. Petit bémol sur le parking.', p.id, v_tenant_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM properties p 
    WHERE p.region = 'Rabat' AND p.title = 'Appartement luxueux à Rabat'
    ORDER BY p.id DESC LIMIT 1;
    
    INSERT INTO property_comments (rating, comment, property_id, user_id, created_at, updated_at)
    SELECT 
        5, 'Riad authentique et charmant. Expérience unique dans la médina!', p.id, v_tenant_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM properties p 
    WHERE p.region = 'Marrakech' AND p.title = 'Riad authentique à Marrakech'
    ORDER BY p.id DESC LIMIT 1;
    
    INSERT INTO property_comments (rating, comment, property_id, user_id, created_at, updated_at)
    SELECT 
        5, 'Vue imprenable sur la mer. Appartement moderne et confortable.', p.id, v_tenant_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM properties p 
    WHERE p.region = 'Tanger' AND p.title = 'Appartement vue mer Tanger'
    ORDER BY p.id DESC LIMIT 1;
    
    INSERT INTO property_comments (rating, comment, property_id, user_id, created_at, updated_at)
    SELECT 
        4, 'Maison traditionnelle très bien restaurée. Quartier historique magnifique.', p.id, v_tenant_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM properties p 
    WHERE p.region = 'Fès' AND p.title = 'Maison dans la médina de Fès'
    ORDER BY p.id DESC LIMIT 1;
    
    INSERT INTO property_comments (rating, comment, property_id, user_id, created_at, updated_at)
    SELECT 
        5, 'Villa de rêve avec piscine! Parfait pour des vacances en famille.', p.id, v_tenant_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM properties p 
    WHERE p.region = 'Agadir' AND p.title = 'Villa avec piscine à Agadir'
    ORDER BY p.id DESC LIMIT 1;
    
    RAISE NOTICE '9 commentaires de propriétés insérés avec succès';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Insertion terminée avec succès!';
    RAISE NOTICE '=====================================================';
    
END $$;

-- =====================================================
-- VÉRIFICATION DES STATISTIQUES
-- =====================================================
-- Exécutez ces requêtes pour vérifier les données insérées

SELECT 'Nombre total de propriétés' as statistique, COUNT(*)::text as valeur FROM properties
UNION ALL
SELECT 'Nombre total d''utilisateurs', COUNT(*)::text FROM users
UNION ALL
SELECT 'Nombre de villes distinctes', COUNT(DISTINCT region)::text FROM properties
UNION ALL
SELECT 'Taux de satisfaction (%)', ROUND(AVG(rating) * 20, 2)::text 
FROM (
    SELECT rating FROM reviews
    UNION ALL
    SELECT rating FROM property_comments
) as all_ratings;

