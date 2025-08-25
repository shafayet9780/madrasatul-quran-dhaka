import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Site Settings (Singleton)
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),
      
      // Footer Settings
      S.listItem()
        .title('Footer Settings')
        .id('footer')
        .child(S.documentTypeList('footer').title('Footer Settings')),
      
      S.divider(),
      
      // Pages
      S.listItem()
        .title('Pages')
        .schemaType('page')
        .child(S.documentTypeList('page').title('Pages')),
      
      // News & Events
      S.listItem()
        .title('News & Events')
        .schemaType('newsEvent')
        .child(
          S.list()
            .title('News & Events')
            .items([
              S.listItem()
                .title('All News & Events')
                .child(S.documentTypeList('newsEvent').title('All News & Events')),
              S.listItem()
                .title('News')
                .child(
                  S.documentTypeList('newsEvent')
                    .title('News')
                    .filter('_type == "newsEvent" && category == "news"')
                ),
              S.listItem()
                .title('Events')
                .child(
                  S.documentTypeList('newsEvent')
                    .title('Events')
                    .filter('_type == "newsEvent" && category == "event"')
                ),
              S.listItem()
                .title('Achievements')
                .child(
                  S.documentTypeList('newsEvent')
                    .title('Achievements')
                    .filter('_type == "newsEvent" && category == "achievement"')
                ),
              S.listItem()
                .title('Featured Items')
                .child(
                  S.documentTypeList('newsEvent')
                    .title('Featured Items')
                    .filter('_type == "newsEvent" && featured == true')
                ),
            ])
        ),
      
      // Academic Programs
      S.listItem()
        .title('Academic Programs')
        .schemaType('academicProgram')
        .child(S.documentTypeList('academicProgram').title('Academic Programs')),
      
      // Staff
      S.listItem()
        .title('Staff')
        .schemaType('staffMember')
        .child(
          S.list()
            .title('Staff')
            .items([
              S.listItem()
                .title('All Staff')
                .child(S.documentTypeList('staffMember').title('All Staff')),
              S.listItem()
                .title('Leadership Team')
                .child(
                  S.documentTypeList('staffMember')
                    .title('Leadership Team')
                    .filter('_type == "staffMember" && isLeadership == true')
                ),
              S.listItem()
                .title('Administration')
                .child(
                  S.documentTypeList('staffMember')
                    .title('Administration')
                    .filter('_type == "staffMember" && department == "administration"')
                ),
              S.listItem()
                .title('Islamic Studies')
                .child(
                  S.documentTypeList('staffMember')
                    .title('Islamic Studies')
                    .filter('_type == "staffMember" && department == "islamic_studies"')
                ),
              S.listItem()
                .title('NCTB Curriculum')
                .child(
                  S.documentTypeList('staffMember')
                    .title('NCTB Curriculum')
                    .filter('_type == "staffMember" && department == "nctb_curriculum"')
                ),
            ])
        ),
      
      // Facilities
      S.listItem()
        .title('Facilities')
        .schemaType('facility')
        .child(
          S.list()
            .title('Facilities')
            .items([
              S.listItem()
                .title('All Facilities')
                .child(S.documentTypeList('facility').title('All Facilities')),
              S.listItem()
                .title('Featured Facilities')
                .child(
                  S.documentTypeList('facility')
                    .title('Featured Facilities')
                    .filter('_type == "facility" && featured == true')
                ),
              S.listItem()
                .title('Academic Facilities')
                .child(
                  S.documentTypeList('facility')
                    .title('Academic Facilities')
                    .filter('_type == "facility" && category == "academic"')
                ),
              S.listItem()
                .title('Islamic Facilities')
                .child(
                  S.documentTypeList('facility')
                    .title('Islamic Facilities')
                    .filter('_type == "facility" && category == "islamic"')
                ),
              S.listItem()
                .title('Recreational Facilities')
                .child(
                  S.documentTypeList('facility')
                    .title('Recreational Facilities')
                    .filter('_type == "facility" && category == "recreational"')
                ),
            ])
        ),
    ])