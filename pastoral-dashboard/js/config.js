// ================= CONFIG =================

// API Key (The placeholder in the original file)
const apiKey = ""; 

// Password for Restricted SLT Access (C7j77emc)
const ACCESS_PASSWORD = "C7j77emc"; 

// Pastoral Structure & Initials Map (3-Letter Codes)
const STAFF_INITIALS_MAP = { 
    "B JASTRZAB": "BJA", 
    "L DOORLY": "LDO", 
    "G BRIODY": "GBR", 
    "I ABSHIR": "IAB", 
    "T SLAVOVA": "TSL", 
    "E GALGEY": "EGA", 
    "K KING": "KKI", 
    "J NEVILLE": "JNE", 
    "E OFORI": "EOF", 
    "A CONWAY": "ACO", 
    "K KRENC": "KKR", 
    "U KAYA": "UKA", 
    "Y ABBEY-ATTRAM": "YAB", 
    "C MAURIS-BLANC": "CMA", 
    "C EMELE": "CEM", 
    "S KISTEN": "SKI", 
    "E BUDE": "EBU", 
    "E TOPRAK": "ETO", 
    "L TOWLER": "LTO", 
    "A SACKS": "ASA", 
    "S KARA": "SKA" 
}; 

// SLT and HOY Leads for Report Assignment
const SLT_LEADS = { 
    "7": "GBR", 
    "8": "EGA", 
    "9": "EGA", 
    "10": "CMA", 
    "11": "SKI", 
    "12": "CMA", 
    "13": "CMA" 
}; 
const HOY_LEADS = { 
    "7": "BJA", 
    "8": "EGA", 
    "9": "GBR", 
    "10": "UKA", 
    "11": "SKI", 
    "12": "CMA", 
    "13": "CMA" 
}; 

// Database for SEN Provisions and Strategies
const SEN_PROVISIONS_DB = {
    // This part was commented out in the original script but is named in the project plan.
    // Assuming it would look like this based on context:
    "ASD": ["Visual communication cards.", "Use specific, literal language.", "Provide a quiet cool-down space."],
    "ADD": ["Break tasks down into small steps.", "Use proximity praise.", "Allow movement breaks."],
    "PMLD": ["Sensory resources available.", "Use simple choice-making prompts."],
    "K": ["Pre-teach key vocabulary.", "Use dual coding (visuals + text).", "Check understanding: 'Tell me what you need to do'."] 
};

// Map incident types to diagnostic categories
const DIAGNOSIS_MAP = {
    safety: ["physical", "altercation", "fighting", "safeguarding", "assault"],
    defiance: ["refusal", "rude", "defiance", "insubordination", "challenging"],
    disruption: ["shouting", "talking", "off-task", "calling out", "noise"],
    organisation: ["equipment", "uniform", "late", "homework", "pencils", "planner"]
};

// Strategy Library mapped to the diagnostic categories
const STRATEGIES = {
    "Safety & Regulation": [
        "Use a non-verbal signal to request a pause or break.",
        "Remove potential triggers (objects, peers).",
        "Offer two acceptable choices to regain control.",
        "Ensure all adults follow the protocol precisely: consistency is critical."
    ],
    "Respect & Cooperation": [
        "Avoid public confrontation; use corridor conversations.",
        "Give 'take up time' after instructions.",
        "Use 'Maybe... and...' language to de-escalate.",
        "Check for underlying unmet needs (hunger, tiredness).",
        "Positive phone call home for small wins."
    ],
    "Engagement & Focus": [
        "Chunk tasks into 10-minute segments.",
        "Use non-verbal cues to redirect (tap on desk).",
        "Provide a fidget aid or movement break.",
        "Seat away from high-distraction peers.",
        "Use 'praise the prox' (praise students nearby)."
    ],
    "Organisation": [
        "Visual timetable on desk.",
        "Equipment check at door (provide quietly if missing).",
        "Scaffold homework tasks clearly.",
        "Regular locker/planner checks."
    ],
    "General Behaviour": [
        "Consistency with school policy.",
        "Build relationship through non-academic talk.",
        "Reinforce positive routines."
    ],
    "SEN_ADD": [
        "Pre-teach key vocabulary.",
        "Use dual coding (visuals + text).",
        "Check understanding: 'Tell me what you need to do'."
    ]
};