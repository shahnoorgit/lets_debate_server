// enums.ts

export enum CategoryEnum {
  POLITICS_AND_GOVERNANCE = "POLITICS_AND_GOVERNANCE",
  ECONOMY_AND_DEVELOPMENT = "ECONOMY_AND_DEVELOPMENT",
  LAW_AND_JUSTICE = "LAW_AND_JUSTICE",
  EDUCATION = "EDUCATION",
  ENVIRONMENT_AND_SUSTAINABILITY = "ENVIRONMENT_AND_SUSTAINABILITY",
  SOCIAL_ISSUES = "SOCIAL_ISSUES",
  SCIENCE_AND_TECHNOLOGY = "SCIENCE_AND_TECHNOLOGY",
  ENTERTAINMENT_AND_MEDIA = "ENTERTAINMENT_AND_MEDIA",
  SPORTS_AND_LEISURE = "SPORTS_AND_LEISURE",
}

export enum InterestEnum {
  // Politics and Governance
  ELECTIONS = "ELECTIONS",
  GOVERNMENT_POLICY = "GOVERNMENT_POLICY",
  INTERNATIONAL_RELATIONS = "INTERNATIONAL_RELATIONS",
  POLITICAL_STRATEGIES = "POLITICAL_STRATEGIES",

  // Economy and Development
  ECONOMY = "ECONOMY",
  BUSINESS_TRENDS = "BUSINESS_TRENDS",
  GLOBAL_TRADE = "GLOBAL_TRADE",
  INNOVATION_IN_BUSINESS = "INNOVATION_IN_BUSINESS",

  // Law and Justice
  LEGAL_SYSTEM = "LEGAL_SYSTEM",
  CRIMINAL_JUSTICE = "CRIMINAL_JUSTICE",
  CIVIL_RIGHTS = "CIVIL_RIGHTS",
  COURT_DECISIONS = "COURT_DECISIONS",

  // Education
  EDUCATIONAL_POLICY = "EDUCATIONAL_POLICY",
  LEARNING_TECHNIQUES = "LEARNING_TECHNIQUES",
  SCHOOL_REFORMS = "SCHOOL_REFORMS",

  // Environment and Sustainability
  CLIMATE_CHANGE = "CLIMATE_CHANGE",
  ENVIRONMENTAL_POLICY = "ENVIRONMENTAL_POLICY",
  SUSTAINABLE_LIVING = "SUSTAINABLE_LIVING",
  RENEWABLE_ENERGY = "RENEWABLE_ENERGY",

  // Social Issues
  SOCIAL_EQUALITY = "SOCIAL_EQUALITY",
  COMMUNITY_DEVELOPMENT = "COMMUNITY_DEVELOPMENT",
  CULTURAL_DIVERSITY = "CULTURAL_DIVERSITY",
  HUMAN_RIGHTS = "HUMAN_RIGHTS",

  // Science and Technology
  WEB_DEVELOPMENT = "WEB_DEVELOPMENT",
  SOFTWARE_ENGINEERING = "SOFTWARE_ENGINEERING",
  AI = "AI",
  TECH_INNOVATION = "TECH_INNOVATION",
  CYBERSECURITY = "CYBERSECURITY",
  ROBOTICS = "ROBOTICS",
  DATA_SCIENCE = "DATA_SCIENCE",
  MOBILE_TECHNOLOGY = "MOBILE_TECHNOLOGY",

  // Entertainment and Media
  FILM_AND_TV = "FILM_AND_TV",
  MUSIC = "MUSIC",
  JOURNALISM = "JOURNALISM",
  DIGITAL_MEDIA = "DIGITAL_MEDIA",
  LITERATURE_AND_THEATRE = "LITERATURE_AND_THEATRE",

  // Sports and Leisure
  CRICKET = "CRICKET",
  IPL = "IPL",
  WWE = "WWE",
  SPORTS_GENERAL = "SPORTS_GENERAL",
  FITNESS = "FITNESS",
  FOOTBALL = "FOOTBALL",
  BASKETBALL = "BASKETBALL",
  TENNIS = "TENNIS",
  FORMULA_ONE = "FORMULA_ONE",
}

export const CATEGORY_INTERESTS = {
  [CategoryEnum.POLITICS_AND_GOVERNANCE]: [
    InterestEnum.ELECTIONS,
    InterestEnum.GOVERNMENT_POLICY,
    InterestEnum.INTERNATIONAL_RELATIONS,
    InterestEnum.POLITICAL_STRATEGIES,
  ],
  [CategoryEnum.ECONOMY_AND_DEVELOPMENT]: [
    InterestEnum.ECONOMY,
    InterestEnum.BUSINESS_TRENDS,
    InterestEnum.GLOBAL_TRADE,
    InterestEnum.INNOVATION_IN_BUSINESS,
  ],
  [CategoryEnum.LAW_AND_JUSTICE]: [
    InterestEnum.LEGAL_SYSTEM,
    InterestEnum.CRIMINAL_JUSTICE,
    InterestEnum.CIVIL_RIGHTS,
    InterestEnum.COURT_DECISIONS,
  ],
  [CategoryEnum.EDUCATION]: [
    InterestEnum.EDUCATIONAL_POLICY,
    InterestEnum.LEARNING_TECHNIQUES,
    InterestEnum.SCHOOL_REFORMS,
  ],
  [CategoryEnum.ENVIRONMENT_AND_SUSTAINABILITY]: [
    InterestEnum.CLIMATE_CHANGE,
    InterestEnum.ENVIRONMENTAL_POLICY,
    InterestEnum.SUSTAINABLE_LIVING,
    InterestEnum.RENEWABLE_ENERGY,
  ],
  [CategoryEnum.SOCIAL_ISSUES]: [
    InterestEnum.SOCIAL_EQUALITY,
    InterestEnum.COMMUNITY_DEVELOPMENT,
    InterestEnum.CULTURAL_DIVERSITY,
    InterestEnum.HUMAN_RIGHTS,
  ],
  [CategoryEnum.SCIENCE_AND_TECHNOLOGY]: [
    InterestEnum.WEB_DEVELOPMENT,
    InterestEnum.SOFTWARE_ENGINEERING,
    InterestEnum.AI,
    InterestEnum.TECH_INNOVATION,
    InterestEnum.CYBERSECURITY,
    InterestEnum.ROBOTICS,
    InterestEnum.DATA_SCIENCE,
    InterestEnum.MOBILE_TECHNOLOGY,
  ],
  [CategoryEnum.ENTERTAINMENT_AND_MEDIA]: [
    InterestEnum.FILM_AND_TV,
    InterestEnum.MUSIC,
    InterestEnum.JOURNALISM,
    InterestEnum.DIGITAL_MEDIA,
    InterestEnum.LITERATURE_AND_THEATRE,
  ],
  [CategoryEnum.SPORTS_AND_LEISURE]: [
    InterestEnum.CRICKET,
    InterestEnum.IPL,
    InterestEnum.WWE,
    InterestEnum.SPORTS_GENERAL,
    InterestEnum.FITNESS,
    InterestEnum.FOOTBALL,
    InterestEnum.BASKETBALL,
    InterestEnum.TENNIS,
    InterestEnum.FORMULA_ONE,
  ],
};

export const HOMOGENEOUS_CATEGORIES = [
  CategoryEnum.POLITICS_AND_GOVERNANCE,
  CategoryEnum.ECONOMY_AND_DEVELOPMENT,
  CategoryEnum.LAW_AND_JUSTICE,
  CategoryEnum.EDUCATION,
  CategoryEnum.ENVIRONMENT_AND_SUSTAINABILITY,
  CategoryEnum.SOCIAL_ISSUES,
];

export const HETEROGENEOUS_CATEGORIES = [
  CategoryEnum.SCIENCE_AND_TECHNOLOGY,
  CategoryEnum.ENTERTAINMENT_AND_MEDIA,
  CategoryEnum.SPORTS_AND_LEISURE,
];

