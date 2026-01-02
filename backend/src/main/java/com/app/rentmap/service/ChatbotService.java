package com.app.rentmap.service;

import com.app.rentmap.entity.Property;
import com.app.rentmap.entity.Tenant;
import com.app.rentmap.entity.User;
import com.app.rentmap.repository.PropertyRepository;
import com.app.rentmap.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ChatbotService {
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    public ChatbotService(PropertyRepository propertyRepository, 
                         UserRepository userRepository) {
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
    }

    public String processMessage(String userMessage, Long tenantId) {
        return processMessage(userMessage, tenantId, "fr");
    }

    public String processMessage(String userMessage, Long tenantId, String language) {
        String message = userMessage.toLowerCase().trim();
        String lang = (language != null && !language.isEmpty()) ? language.toLowerCase() : "fr";
        
        // Get tenant information for personalized responses
        Tenant tenant = null;
        if (tenantId != null) {
            User user = userRepository.findById(tenantId).orElse(null);
            if (user instanceof Tenant) {
                tenant = (Tenant) user;
            }
        }

        // Greeting patterns
        if (matchesPattern(message, "bonjour|salut|hello|hi|hey|bonsoir|مرحبا|أهلا|صباح الخير|مساء الخير")) {
            return generateGreeting(tenant, lang);
        }

        // Help patterns
        if (matchesPattern(message, "aide|help|assistance|comment|comment faire|guide|مساعدة|مساعدة")) {
            return getHelpMessage(lang);
        }

        // Search patterns
        if (matchesPattern(message, "cherche|search|trouve|find|recherche|propriété|property|appartement|maison|ابحث|بحث|عقار|شقة|منزل")) {
            return handleSearchRequest(message, tenant, lang);
        }

        // Price patterns
        if (matchesPattern(message, "prix|price|coût|cost|budget|cher|pas cher|économique|سعر|ثمن|ميزانية|غالي|رخيص")) {
            return handlePriceQuery(message, tenant, lang);
        }

        // Location/Region patterns
        if (matchesPattern(message, "région|region|ville|city|où|where|location|lieu|adresse|منطقة|مدينة|أين|مكان|عنوان")) {
            return handleLocationQuery(message, tenant, lang);
        }

        // Property features patterns
        if (matchesPattern(message, "chambre|bedroom|room|pièce|wifi|parking|climatisation|furnished|meublé|animaux|pets|غرفة|واي فاي|موقف|مكيف|مفروش|حيوانات")) {
            return handleFeatureQuery(message, lang);
        }

        // Availability patterns
        if (matchesPattern(message, "disponible|available|quand|when|date|متاح|متى|تاريخ")) {
            return handleAvailabilityQuery(lang);
        }

        // Contact/Owner patterns
        if (matchesPattern(message, "contact|contacter|owner|propriétaire|email|téléphone|phone|اتصال|اتصل|مالك|بريد|هاتف")) {
            return getContactMessage(lang);
        }

        // General rental advice
        if (matchesPattern(message, "conseil|advice|astuce|tip|recommandation|suggestion|نصيحة|نصائح|اقتراح")) {
            return getRentalAdvice(lang);
        }

        // Statistics
        if (matchesPattern(message, "statistique|statistic|nombre|count|combien|how many|إحصائية|عدد|كم")) {
            return getStatistics(lang);
        }

        // Default response
        return getDefaultResponse(message, tenant, lang);
    }

    private boolean matchesPattern(String message, String patterns) {
        String[] patternArray = patterns.split("\\|");
        for (String pattern : patternArray) {
            if (message.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    private String generateGreeting(Tenant tenant, String lang) {
        StringBuilder greeting = new StringBuilder();
        
        if ("ar".equals(lang)) {
            greeting.append("مرحبا ! 👋 أنا مساعدك الافتراضي لمساعدتك في العثور على عقار الإيجار المثالي.\n\n");
            
            if (tenant != null && tenant.getPreferredRegion() != null) {
                greeting.append("أرى أنك مهتم بالمنطقة : ").append(tenant.getPreferredRegion()).append(".\n");
            }
            
            if (tenant != null && tenant.getMaxBudget() != null) {
                greeting.append("ميزانيتك القصوى هي : ").append(tenant.getMaxBudget()).append(" درهم.\n");
            }
            
            greeting.append("\nكيف يمكنني مساعدتك اليوم؟ يمكنك أن تطلب مني :\n");
            greeting.append("• البحث عن عقارات\n");
            greeting.append("• معلومات عن الأسعار\n");
            greeting.append("• نصائح حول الإيجار\n");
            greeting.append("• إحصائيات عن العقارات المتاحة\n");
            greeting.append("\nاكتب 'مساعدة' لرؤية جميع الأوامر المتاحة.");
        } else if ("en".equals(lang)) {
            greeting.append("Hello! 👋 I'm your virtual assistant to help you find the perfect rental property.\n\n");
            
            if (tenant != null && tenant.getPreferredRegion() != null) {
                greeting.append("I see you're interested in the region: ").append(tenant.getPreferredRegion()).append(".\n");
            }
            
            if (tenant != null && tenant.getMaxBudget() != null) {
                greeting.append("Your maximum budget is: ").append(tenant.getMaxBudget()).append(" MAD.\n");
            }
            
            greeting.append("\nHow can I help you today? You can ask me to:\n");
            greeting.append("• Search for properties\n");
            greeting.append("• Information about prices\n");
            greeting.append("• Rental advice\n");
            greeting.append("• Statistics on available properties\n");
            greeting.append("\nType 'help' to see all available commands.");
        } else {
            // French (default)
            greeting.append("Bonjour ! 👋 Je suis votre assistant virtuel pour vous aider à trouver la propriété de location idéale.\n\n");
        
        if (tenant != null && tenant.getPreferredRegion() != null) {
            greeting.append("Je vois que vous êtes intéressé par la région : ").append(tenant.getPreferredRegion()).append(".\n");
        }
        
        if (tenant != null && tenant.getMaxBudget() != null) {
            greeting.append("Votre budget maximum est de : ").append(tenant.getMaxBudget()).append(" MAD.\n");
        }
        
        greeting.append("\nComment puis-je vous aider aujourd'hui ? Vous pouvez me demander :\n");
        greeting.append("• De rechercher des propriétés\n");
        greeting.append("• Des informations sur les prix\n");
        greeting.append("• Des conseils sur la location\n");
        greeting.append("• Des statistiques sur les propriétés disponibles\n");
        greeting.append("\nTapez 'aide' pour voir toutes les commandes disponibles.");
        }
        
        return greeting.toString();
    }

    private String getHelpMessage(String lang) {
        if ("ar".equals(lang)) {
            return "🔍 **الأوامر المتاحة :**\n\n" +
                   "**البحث :**\n" +
                   "• \"ابحث عن عقارات في [منطقة]\"\n" +
                   "• \"ابحث عن شقق مع واي فاي\"\n" +
                   "• \"ابحث عن منازل مع موقف سيارات\"\n\n" +
                   "**السعر :**\n" +
                   "• \"ما هي الأسعار المتوسطة؟\"\n" +
                   "• \"عقارات في ميزانيتي\"\n" +
                   "• \"عقارات رخيصة\"\n\n" +
                   "**الموقع :**\n" +
                   "• \"ما هي المناطق المتاحة؟\"\n" +
                   "• \"عقارات في [مدينة]\"\n\n" +
                   "**المميزات :**\n" +
                   "• \"عقارات مع واي فاي\"\n" +
                   "• \"شقق مفروشة\"\n" +
                   "• \"منازل مع موقف سيارات\"\n\n" +
                   "**نصائح :**\n" +
                   "• \"أعطني نصائح\"\n" +
                   "• \"نصائح للعثور على سكن\"\n\n" +
                   "لا تتردد في طرح أسئلتك! 😊";
        } else if ("en".equals(lang)) {
            return "🔍 **Available Commands:**\n\n" +
                   "**Search:**\n" +
                   "• \"Search for properties in [region]\"\n" +
                   "• \"Find apartments with wifi\"\n" +
                   "• \"Search for houses with parking\"\n\n" +
                   "**Price:**\n" +
                   "• \"What are the average prices?\"\n" +
                   "• \"Properties in my budget\"\n" +
                   "• \"Cheap properties\"\n\n" +
                   "**Location:**\n" +
                   "• \"What regions are available?\"\n" +
                   "• \"Properties in [city]\"\n\n" +
                   "**Features:**\n" +
                   "• \"Properties with wifi\"\n" +
                   "• \"Furnished apartments\"\n" +
                   "• \"Houses with parking\"\n\n" +
                   "**Advice:**\n" +
                   "• \"Give me advice\"\n" +
                   "• \"Tips for finding accommodation\"\n\n" +
                   "Feel free to ask me your questions! 😊";
        } else {
            // French (default)
        return "🔍 **Commandes disponibles :**\n\n" +
               "**Recherche :**\n" +
               "• \"Cherche des propriétés à [région]\"\n" +
               "• \"Trouve des appartements avec wifi\"\n" +
               "• \"Recherche des maisons avec parking\"\n\n" +
               "**Prix :**\n" +
               "• \"Quels sont les prix moyens ?\"\n" +
               "• \"Propriétés dans mon budget\"\n" +
               "• \"Propriétés pas chères\"\n\n" +
               "**Localisation :**\n" +
               "• \"Quelles régions sont disponibles ?\"\n" +
               "• \"Propriétés à [ville]\"\n\n" +
               "**Caractéristiques :**\n" +
               "• \"Propriétés avec wifi\"\n" +
               "• \"Appartements meublés\"\n" +
               "• \"Maisons avec parking\"\n\n" +
               "**Conseils :**\n" +
               "• \"Donne-moi des conseils\"\n" +
               "• \"Astuces pour trouver un logement\"\n\n" +
               "N'hésitez pas à me poser vos questions ! 😊";
        }
    }

    private String handleSearchRequest(String message, Tenant tenant, String lang) {
        StringBuilder response = new StringBuilder();
        
        // Extract region if mentioned
        String region = extractRegion(message);
        BigDecimal maxPrice = tenant != null && tenant.getMaxBudget() != null 
            ? BigDecimal.valueOf(tenant.getMaxBudget()) 
            : null;
        
        // Extract price from message if mentioned
        BigDecimal messagePrice = extractPrice(message);
        if (messagePrice != null) {
            maxPrice = messagePrice;
        }
        
        // Extract features
        boolean hasWifi = message.contains("wifi");
        boolean hasParking = message.contains("parking");
        boolean isFurnished = message.contains("meublé") || message.contains("furnished");
        boolean petsAllowed = message.contains("animaux") || message.contains("pets");
        
        List<Property> properties;
        
        if (region != null && maxPrice != null) {
            properties = propertyRepository.findByRegionAndMaxPrice(region, maxPrice, PageRequest.of(0, 5)).getContent();
        } else if (region != null) {
            properties = propertyRepository.findByRegion(region, PageRequest.of(0, 5)).getContent();
        } else if (maxPrice != null) {
            properties = propertyRepository.findByMaxPrice(maxPrice, PageRequest.of(0, 5)).getContent();
        } else {
            properties = propertyRepository.findAll(PageRequest.of(0, 5)).getContent();
        }
        
        // Filter by features if mentioned
        if (hasWifi || hasParking || isFurnished || petsAllowed) {
            properties = properties.stream()
                .filter(p -> (!hasWifi || Boolean.TRUE.equals(p.getHasWifi())) &&
                            (!hasParking || Boolean.TRUE.equals(p.getHasParking())) &&
                            (!isFurnished || Boolean.TRUE.equals(p.getHasFurnished())) &&
                            (!petsAllowed || Boolean.TRUE.equals(p.getPetsAllowed())))
                .collect(Collectors.toList());
        }
        
        if (properties.isEmpty()) {
            if ("ar".equals(lang)) {
                response.append("عذراً، لم أجد عقارات تطابق معاييرك. ");
                response.append("حاول تعديل معايير البحث أو تصفح جميع العقارات المتاحة على الخريطة.");
            } else if ("en".equals(lang)) {
                response.append("Sorry, I didn't find any properties matching your criteria. ");
                response.append("Try modifying your search criteria or browse all available properties on the map.");
            } else {
            response.append("Désolé, je n'ai pas trouvé de propriétés correspondant à vos critères. ");
            response.append("Essayez de modifier vos critères de recherche ou consultez toutes les propriétés disponibles sur la carte.");
            }
        } else {
            if ("ar".equals(lang)) {
                response.append("وجدت ").append(properties.size()).append(" عقار(عقارات) قد تهمك :\n\n");
            } else if ("en".equals(lang)) {
                response.append("I found ").append(properties.size()).append(" property(ies) that might interest you:\n\n");
        } else {
            response.append("J'ai trouvé ").append(properties.size()).append(" propriété(s) qui pourraient vous intéresser :\n\n");
            }
            
            for (int i = 0; i < Math.min(properties.size(), 3); i++) {
                Property prop = properties.get(i);
                response.append("🏠 **").append(prop.getTitle()).append("**\n");
                response.append("📍 ").append(prop.getRegion()).append("\n");
                response.append("💰 ").append(prop.getPrice()).append(" MAD");
                if (prop.getRentalPeriod() != null) {
                    response.append("/").append(prop.getRentalPeriod().toLowerCase());
                }
                response.append("\n");
                response.append("📐 ").append(prop.getArea()).append(" m²\n");
                if (prop.getNumberOfBedrooms() != null) {
                    if ("ar".equals(lang)) {
                        response.append("🛏️ ").append(prop.getNumberOfBedrooms()).append(" غرفة(غرف)\n");
                    } else if ("en".equals(lang)) {
                        response.append("🛏️ ").append(prop.getNumberOfBedrooms()).append(" bedroom(s)\n");
                    } else {
                    response.append("🛏️ ").append(prop.getNumberOfBedrooms()).append(" chambre(s)\n");
                    }
                }
                // Add property link in a format that frontend can parse
                if ("ar".equals(lang)) {
                    response.append("\n🔗 [عرض تفاصيل هذا العقار](PROPERTY:").append(prop.getId()).append(")\n");
                } else if ("en".equals(lang)) {
                    response.append("\n🔗 [View details of this property](PROPERTY:").append(prop.getId()).append(")\n");
                } else {
                response.append("\n🔗 [Voir les détails de cette propriété](PROPERTY:").append(prop.getId()).append(")\n");
                }
                response.append("\n");
            }
            
            if (properties.size() > 3) {
                if ("ar".equals(lang)) {
                    response.append("... و ").append(properties.size() - 3).append(" عقار(عقارات) أخرى.\n");
                } else if ("en".equals(lang)) {
                    response.append("... and ").append(properties.size() - 3).append(" other property(ies).\n");
                } else {
                response.append("... et ").append(properties.size() - 3).append(" autre(s) propriété(s).\n");
                }
            }
            
            if ("ar".equals(lang)) {
                response.append("\nتصفح الخريطة التفاعلية لرؤية جميع العقارات المتاحة!");
            } else if ("en".equals(lang)) {
                response.append("\nBrowse the interactive map to see all available properties!");
            } else {
            response.append("\nConsultez la carte interactive pour voir toutes les propriétés disponibles !");
            }
        }
        
        return response.toString();
    }

    private String handlePriceQuery(String message, Tenant tenant, String lang) {
        List<Property> allProperties = propertyRepository.findAll();
        
        if (allProperties.isEmpty()) {
            if ("ar".equals(lang)) {
                return "لا توجد حالياً أي عقارات متاحة على المنصة.";
            } else if ("en".equals(lang)) {
                return "There are currently no properties available on the platform.";
            } else {
            return "Il n'y a actuellement aucune propriété disponible sur la plateforme.";
            }
        }
        
        double avgPrice = allProperties.stream()
            .mapToDouble(p -> p.getPrice().doubleValue())
            .average()
            .orElse(0.0);
        
        double minPrice = allProperties.stream()
            .mapToDouble(p -> p.getPrice().doubleValue())
            .min()
            .orElse(0.0);
        
        double maxPrice = allProperties.stream()
            .mapToDouble(p -> p.getPrice().doubleValue())
            .max()
            .orElse(0.0);
        
        StringBuilder response = new StringBuilder();
        if ("ar".equals(lang)) {
            response.append("💰 **معلومات عن الأسعار :**\n\n");
            response.append("• السعر المتوسط : ").append(String.format("%.2f", avgPrice)).append(" درهم\n");
            response.append("• السعر الأدنى : ").append(String.format("%.2f", minPrice)).append(" درهم\n");
            response.append("• السعر الأعلى : ").append(String.format("%.2f", maxPrice)).append(" درهم\n");
        } else if ("en".equals(lang)) {
            response.append("💰 **Price Information:**\n\n");
            response.append("• Average price: ").append(String.format("%.2f", avgPrice)).append(" MAD\n");
            response.append("• Minimum price: ").append(String.format("%.2f", minPrice)).append(" MAD\n");
            response.append("• Maximum price: ").append(String.format("%.2f", maxPrice)).append(" MAD\n");
        } else {
        response.append("💰 **Informations sur les prix :**\n\n");
        response.append("• Prix moyen : ").append(String.format("%.2f", avgPrice)).append(" MAD\n");
        response.append("• Prix minimum : ").append(String.format("%.2f", minPrice)).append(" MAD\n");
        response.append("• Prix maximum : ").append(String.format("%.2f", maxPrice)).append(" MAD\n");
        }
        
        if (tenant != null && tenant.getMaxBudget() != null) {
            long affordableCount = allProperties.stream()
                .filter(p -> p.getPrice().doubleValue() <= tenant.getMaxBudget())
                .count();
            if ("ar".equals(lang)) {
                response.append("\n📊 مع ميزانيتك البالغة ").append(tenant.getMaxBudget()).append(" درهم، ");
                response.append("هناك ").append(affordableCount).append(" عقار(عقارات) متاح(متاحة).");
            } else if ("en".equals(lang)) {
                response.append("\n📊 With your budget of ").append(tenant.getMaxBudget()).append(" MAD, ");
                response.append("there are ").append(affordableCount).append(" available property(ies).");
            } else {
            response.append("\n📊 Avec votre budget de ").append(tenant.getMaxBudget()).append(" MAD, ");
            response.append("il y a ").append(affordableCount).append(" propriété(s) disponible(s).");
            }
        }
        
        return response.toString();
    }

    private String handleLocationQuery(String message, Tenant tenant, String lang) {
        List<String> regions = propertyRepository.findAll().stream()
            .map(Property::getRegion)
            .distinct()
            .collect(Collectors.toList());
        
        if (regions.isEmpty()) {
            if ("ar".equals(lang)) {
                return "لا توجد حالياً أي عقارات متاحة.";
            } else if ("en".equals(lang)) {
                return "There are currently no properties available.";
            } else {
            return "Il n'y a actuellement aucune propriété disponible.";
            }
        }
        
        StringBuilder response = new StringBuilder();
        if ("ar".equals(lang)) {
            response.append("📍 **المناطق المتاحة :**\n\n");
        } else if ("en".equals(lang)) {
            response.append("📍 **Available Regions:**\n\n");
        } else {
        response.append("📍 **Régions disponibles :**\n\n");
        }
        
        for (String region : regions) {
            long count = propertyRepository.findAll().stream()
                .filter(p -> p.getRegion().equals(region))
                .count();
            if ("ar".equals(lang)) {
                response.append("• ").append(region).append(" (").append(count).append(" عقار(عقارات))\n");
            } else if ("en".equals(lang)) {
                response.append("• ").append(region).append(" (").append(count).append(" property(ies))\n");
            } else {
            response.append("• ").append(region).append(" (").append(count).append(" propriété(s))\n");
            }
        }
        
        if (tenant != null && tenant.getPreferredRegion() != null) {
            if ("ar".equals(lang)) {
                response.append("\n💡 منطقتك المفضلة هي : ").append(tenant.getPreferredRegion());
            } else if ("en".equals(lang)) {
                response.append("\n💡 Your preferred region is: ").append(tenant.getPreferredRegion());
            } else {
            response.append("\n💡 Votre région préférée est : ").append(tenant.getPreferredRegion());
            }
        }
        
        return response.toString();
    }

    private String handleFeatureQuery(String message, String lang) {
        long withWifi = propertyRepository.findAll().stream()
            .filter(p -> Boolean.TRUE.equals(p.getHasWifi()))
            .count();
        
        long withParking = propertyRepository.findAll().stream()
            .filter(p -> Boolean.TRUE.equals(p.getHasParking()))
            .count();
        
        long furnished = propertyRepository.findAll().stream()
            .filter(p -> Boolean.TRUE.equals(p.getHasFurnished()))
            .count();
        
        long petsAllowed = propertyRepository.findAll().stream()
            .filter(p -> Boolean.TRUE.equals(p.getPetsAllowed()))
            .count();
        
        StringBuilder response = new StringBuilder();
        if ("ar".equals(lang)) {
            response.append("🏠 **العقارات حسب المميزات :**\n\n");
            response.append("• مع واي فاي : ").append(withWifi).append(" عقار(عقارات)\n");
            response.append("• مع موقف سيارات : ").append(withParking).append(" عقار(عقارات)\n");
            response.append("• مفروشة : ").append(furnished).append(" عقار(عقارات)\n");
            response.append("• تقبل الحيوانات : ").append(petsAllowed).append(" عقار(عقارات)\n");
        } else if ("en".equals(lang)) {
            response.append("🏠 **Properties by Features:**\n\n");
            response.append("• With WiFi: ").append(withWifi).append(" property(ies)\n");
            response.append("• With parking: ").append(withParking).append(" property(ies)\n");
            response.append("• Furnished: ").append(furnished).append(" property(ies)\n");
            response.append("• Pets allowed: ").append(petsAllowed).append(" property(ies)\n");
        } else {
        response.append("🏠 **Propriétés par caractéristiques :**\n\n");
        response.append("• Avec WiFi : ").append(withWifi).append(" propriété(s)\n");
        response.append("• Avec parking : ").append(withParking).append(" propriété(s)\n");
        response.append("• Meublées : ").append(furnished).append(" propriété(s)\n");
        response.append("• Animaux acceptés : ").append(petsAllowed).append(" propriété(s)\n");
        }
        
        return response.toString();
    }

    private String handleAvailabilityQuery(String lang) {
        long availableNow = propertyRepository.findAll().stream()
            .filter(p -> p.getAvailability() != null && 
                        !p.getAvailability().isAfter(java.time.LocalDate.now()))
            .count();
        
        if ("ar".equals(lang)) {
            return "📅 **التوفر :**\n\n" +
                   "هناك حالياً " + availableNow + " عقار(عقارات) متاح(متاحة) فوراً.\n\n" +
                   "لمعرفة التواريخ الدقيقة للتوفر، راجع تفاصيل كل عقار على الخريطة.";
        } else if ("en".equals(lang)) {
            return "📅 **Availability:**\n\n" +
                   "There are currently " + availableNow + " property(ies) available immediately.\n\n" +
                   "To see exact availability dates, check the details of each property on the map.";
        } else {
        return "📅 **Disponibilité :**\n\n" +
               "Il y a actuellement " + availableNow + " propriété(s) disponible(s) immédiatement.\n\n" +
               "Pour voir les dates exactes de disponibilité, consultez les détails de chaque propriété sur la carte.";
        }
    }

    private String getContactMessage(String lang) {
        if ("ar".equals(lang)) {
            return "للتواصل مع المالك، يمكنك استخدام نظام المراسلة في المنصة. " +
                   "انقر على عقار يهمك واستخدم زر الاتصال لإرسال رسالة مباشرة إلى المالك.";
        } else if ("en".equals(lang)) {
            return "To contact an owner, you can use the platform's messaging system. " +
                   "Click on a property that interests you and use the contact button to send a message directly to the owner.";
        } else {
            return "Pour contacter un propriétaire, vous pouvez utiliser le système de messagerie de la plateforme. " +
                   "Cliquez sur une propriété qui vous intéresse et utilisez le bouton de contact pour envoyer un message directement au propriétaire.";
        }
    }

    private String getRentalAdvice(String lang) {
        if ("ar".equals(lang)) {
            return "💡 **نصائح للعثور على سكنك المثالي :**\n\n" +
                   "1. **حدد ميزانيتك** : حدد المبلغ الذي يمكنك إنفاقه شهرياً، بما في ذلك الرسوم.\n\n" +
                   "2. **اختر المنطقة المناسبة** : ضع في اعتبارك قرب مكان عملك ووسائل النقل والخدمات.\n\n" +
                   "3. **اذكر أولوياتك** : واي فاي، موقف سيارات، مفروش أم لا، قبول الحيوانات، إلخ.\n\n" +
                   "4. **قم بزيارة إن أمكن** : حتى لو كنت تستخدم المنصة عبر الإنترنت، يُنصح بزيارة فعلية.\n\n" +
                   "5. **اقرأ المراجعات** : راجع التعليقات ومراجعات المستأجرين الآخرين.\n\n" +
                   "6. **تحقق من المستندات** : تأكد من وجود جميع المستندات اللازمة (بطاقة الهوية، الضمان، إلخ).\n\n" +
                   "7. **اتصل بالمالكين** : استخدم نظام المراسلة في المنصة لطرح أسئلتك.\n\n" +
                   "حظاً موفقاً في بحثك! 🍀";
        } else if ("en".equals(lang)) {
            return "💡 **Tips for finding your ideal accommodation:**\n\n" +
                   "1. **Define your budget**: Determine how much you can spend per month, including charges.\n\n" +
                   "2. **Choose the right region**: Consider the proximity to your work, transportation, and services.\n\n" +
                   "3. **List your priorities**: WiFi, parking, furnished or not, pets allowed, etc.\n\n" +
                   "4. **Visit if possible**: Even if you use the online platform, a physical visit is recommended.\n\n" +
                   "5. **Read reviews**: Check comments and reviews from other tenants.\n\n" +
                   "6. **Check documents**: Make sure you have all necessary documents (ID, guarantee, etc.).\n\n" +
                   "7. **Contact owners**: Use the platform's messaging system to ask your questions.\n\n" +
                   "Good luck in your search! 🍀";
        } else {
            return "💡 **Conseils pour trouver votre logement idéal :**\n\n" +
                   "1. **Définissez votre budget** : Déterminez combien vous pouvez dépenser par mois, en incluant les charges.\n\n" +
                   "2. **Choisissez la bonne région** : Considérez la proximité de votre travail, des transports et des services.\n\n" +
                   "3. **Listez vos priorités** : WiFi, parking, meublé ou non, animaux acceptés, etc.\n\n" +
                   "4. **Visitez si possible** : Même si vous utilisez la plateforme en ligne, une visite physique est recommandée.\n\n" +
                   "5. **Lisez les avis** : Consultez les commentaires et avis des autres locataires.\n\n" +
                   "6. **Vérifiez les documents** : Assurez-vous d'avoir tous les documents nécessaires (pièce d'identité, garantie, etc.).\n\n" +
                   "7. **Contactez les propriétaires** : Utilisez la messagerie de la plateforme pour poser vos questions.\n\n" +
                   "Bonne chance dans votre recherche ! 🍀";
        }
    }

    private String getStatistics(String lang) {
        long totalProperties = propertyRepository.count();
        long distinctRegions = propertyRepository.countDistinctRegions();
        
        if (totalProperties == 0) {
            if ("ar".equals(lang)) {
                return "لا توجد حالياً أي عقارات متاحة على المنصة.";
            } else if ("en".equals(lang)) {
                return "There are currently no properties available on the platform.";
            } else {
                return "Il n'y a actuellement aucune propriété disponible sur la plateforme.";
            }
        }
        
        double avgPrice = propertyRepository.findAll().stream()
            .mapToDouble(p -> p.getPrice().doubleValue())
            .average()
            .orElse(0.0);
        
        if ("ar".equals(lang)) {
            return "📊 **إحصائيات المنصة :**\n\n" +
                   "• إجمالي عدد العقارات : " + totalProperties + "\n" +
                   "• عدد المناطق : " + distinctRegions + "\n" +
                   "• السعر المتوسط : " + String.format("%.2f", avgPrice) + " درهم\n\n" +
                   "استخدم الخريطة التفاعلية لاستكشاف جميع العقارات المتاحة!";
        } else if ("en".equals(lang)) {
            return "📊 **Platform Statistics:**\n\n" +
                   "• Total number of properties: " + totalProperties + "\n" +
                   "• Number of regions: " + distinctRegions + "\n" +
                   "• Average price: " + String.format("%.2f", avgPrice) + " MAD\n\n" +
                   "Use the interactive map to explore all available properties!";
        } else {
            return "📊 **Statistiques de la plateforme :**\n\n" +
                   "• Nombre total de propriétés : " + totalProperties + "\n" +
                   "• Nombre de régions : " + distinctRegions + "\n" +
                   "• Prix moyen : " + String.format("%.2f", avgPrice) + " MAD\n\n" +
                   "Utilisez la carte interactive pour explorer toutes les propriétés disponibles !";
        }
    }

    private String getDefaultResponse(String message, Tenant tenant, String lang) {
        if ("ar".equals(lang)) {
            return "أفهم أنك تبحث عن : \"" + message + "\".\n\n" +
                   "يمكنني مساعدتك في :\n" +
                   "• البحث عن عقارات حسب معاييرك\n" +
                   "• الحصول على معلومات عن الأسعار والمناطق\n" +
                   "• تقديم نصائح حول الإيجار\n" +
                   "• الإجابة على أسئلتك حول مميزات العقارات\n\n" +
                   "حاول إعادة صياغة سؤالك أو اكتب 'مساعدة' لرؤية جميع الأوامر المتاحة. 😊";
        } else if ("en".equals(lang)) {
            return "I understand you're looking for: \"" + message + "\".\n\n" +
                   "I can help you with:\n" +
                   "• Searching for properties according to your criteria\n" +
                   "• Getting information about prices and regions\n" +
                   "• Giving rental advice\n" +
                   "• Answering your questions about property features\n\n" +
                   "Try rephrasing your question or type 'help' to see all available commands. 😊";
        } else {
            return "Je comprends que vous cherchez : \"" + message + "\".\n\n" +
                   "Je peux vous aider à :\n" +
                   "• Rechercher des propriétés selon vos critères\n" +
                   "• Obtenir des informations sur les prix et les régions\n" +
                   "• Donner des conseils sur la location\n" +
                   "• Répondre à vos questions sur les caractéristiques des propriétés\n\n" +
                   "Essayez de reformuler votre question ou tapez 'aide' pour voir toutes les commandes disponibles. 😊";
        }
    }

    private String extractRegion(String message) {
        // Simple region extraction - can be enhanced
        List<String> commonRegions = List.of("casablanca", "rabat", "marrakech", "fes", "tanger", "agadir", "meknes", "oujda");
        for (String region : commonRegions) {
            if (message.contains(region)) {
                return region.substring(0, 1).toUpperCase() + region.substring(1);
            }
        }
        return null;
    }

    private BigDecimal extractPrice(String message) {
        // Extract numbers that might be prices
        Pattern pricePattern = Pattern.compile("(\\d+)\\s*(mad|dh|dirham)");
        java.util.regex.Matcher matcher = pricePattern.matcher(message.toLowerCase());
        if (matcher.find()) {
            try {
                return BigDecimal.valueOf(Long.parseLong(matcher.group(1)));
            } catch (NumberFormatException e) {
                // Ignore
            }
        }
        
        // Try to find standalone large numbers (likely prices)
        Pattern numberPattern = Pattern.compile("\\b(\\d{4,})\\b");
        matcher = numberPattern.matcher(message);
        if (matcher.find()) {
            try {
                long value = Long.parseLong(matcher.group(1));
                if (value > 1000 && value < 1000000) { // Reasonable price range
                    return BigDecimal.valueOf(value);
                }
            } catch (NumberFormatException e) {
                // Ignore
            }
        }
        
        return null;
    }

    public Long getChatbotUserId() {
        // Try to find chatbot user
        return userRepository.findAll().stream()
            .filter(u -> "CHATBOT".equalsIgnoreCase(u.getRole()) || 
                        "chatbot@rentmap.com".equalsIgnoreCase(u.getEmail()))
            .map(User::getId)
            .findFirst()
            .orElse(null);
    }
}

