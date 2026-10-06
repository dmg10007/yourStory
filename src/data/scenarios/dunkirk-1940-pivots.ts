/**
 * Pivot content for the Dunkirk scenario: sources, plausibility cases, and horizon-tagged
 * consequence seeds. Each seed is counterfactual, so none is documented fact; evidence
 * strength decays from the aftermath to the present day (see docs/pivot-authoring.md).
 */

export const dunkirkPivotSources = [
  {
    id: "src-museum-pm-001",
    title: "The Cabinet Crisis, May 1940",
    author: "Museum of the Prime Minister",
    kind: "secondary",
    version: "online article, 2025",
    publishedYear: 2025,
    sourceUrl: "https://www.museumofpm.org/articles/the-cabinet-crisis-may-1940/",
    locator: "Whole article; excerpts of War Cabinet minutes, 26-28 May 1940",
    claimsSupported: [
      "Halifax's case for exploring terms through Mussolini",
      "Halifax's suggestion that he might resign",
      "Churchill's opposition to mediation",
      "Chamberlain's position on 27 May",
      "Concern over losing the BEF's trained regulars",
      "American confidence in British survival",
      "Operation Dynamo authorized on 26 May"
    ],
    rightsNote: "Metadata only; excerpts require rights review. Quotes War Cabinet minutes held by the National Archives (CAB 65); verify reuse terms before republication.",
    reviewStatus: "reviewed"
  },
  {
    id: "src-grimsley-peace-001",
    title: "What If Britain Had Made Peace With Hitler?",
    author: "Mark Grimsley",
    kind: "secondary",
    version: "HistoryNet web edition of a November 2007 World War II Magazine article",
    publishedYear: 2007,
    sourceUrl: "https://historynet.com/britain-made-peace-hitler/",
    locator: "Whole article, including its summary of Ian Kershaw's Fateful Choices",
    claimsSupported: [
      "Halifax as the first choice to succeed Chamberlain",
      "Possible terms of a Mussolini-mediated settlement",
      "Kershaw's assessment of a negotiated settlement",
      "About 17,000 evacuated by 28 May",
      "Britain fought on and helped form the Grand Alliance"
    ],
    rightsNote: "Metadata only; excerpts require rights review.",
    reviewStatus: "reviewed"
  },
  {
    id: "src-lengel-halt-001",
    title: "Decisions: Hitler's Halt Order",
    author: "Edward G. Lengel",
    kind: "secondary",
    version: "HistoryNet web edition of a November 2011 Military History article",
    publishedYear: 2011,
    sourceUrl: "https://historynet.com/decisions-hitlers-halt-order/",
    locator: "Whole article",
    claimsSupported: [
      "Panzers about 12 miles from Dunkirk at the Aa Canal",
      "Rundstedt's concern over tank losses and a repeat of the Arras counterattack",
      "Hitler confirming the halt order over Guderian's protest",
      "Pontoon bridges across the Aa Canal",
      "Dunkirk left to the Luftwaffe"
    ],
    rightsNote: "Metadata only; excerpts require rights review.",
    reviewStatus: "reviewed"
  },
  {
    id: "src-historic-england-001",
    title: "Operation Dynamo: The Miracle of Dunkirk",
    author: "Historic England",
    kind: "secondary",
    version: "blog post, 25 May 2020",
    publishedYear: 2020,
    sourceUrl: "https://heritagecalling.com/2020/05/25/operation-dynamo-the-miracle-of-dunkirk/",
    locator: "Whole post",
    claimsSupported: [
      "338,226 soldiers rescued",
      "About 68,000 men of the BEF lost in the campaign",
      "Equipment destroyed or abandoned"
    ],
    rightsNote: "Metadata only; excerpts require rights review.",
    reviewStatus: "reviewed"
  },
  {
    id: "src-ebsco-dunkirk-001",
    title: "Evacuation of Dunkirk",
    author: "EBSCO Research Starters",
    kind: "secondary",
    version: "research starter, 2020",
    publishedYear: 2020,
    sourceUrl: "https://www.ebsco.com/research-starters/military-history-and-science/evacuation-dunkirk/",
    locator: "Whole article",
    claimsSupported: [
      "About 338,000 evacuated, 224,000 of them British",
      "Evacuation exceeded expectations"
    ],
    rightsNote: "Metadata only; excerpts require rights review.",
    reviewStatus: "reviewed"
  },
  {
    id: "src-dunkirk-wiki-001",
    title: "Dunkirk evacuation",
    author: "Wikipedia contributors",
    kind: "reference",
    version: "accessed 2026",
    publishedYear: 2003,
    sourceUrl: "https://en.wikipedia.org/wiki/Dunkirk_evacuation",
    locator: "Whole article",
    claimsSupported: [
      "7,669 evacuated on the first day",
      "338,226 rescued by the eighth day",
      "Halt order timeline"
    ],
    rightsNote: "Community-maintained reference; verify against primary sources before republication.",
    reviewStatus: "reviewed"
  }
];

export const noHaltOrderPivot = {
  plausibility: {
    minimalRewrite: "The pause began as General von Rundstedt's own caution, not a directive from Hitler: his generals worried about tank losses and a repeat of the Arras counterattack, and Hitler confirmed the order on 24 May over the protests of generals such as Guderian. Guderian's panzers were already within about 12 miles of Dunkirk and had bridged the Aa Canal, so a different judgment by Rundstedt or Hitler would not have required any change in the military situation.",
    evidenceIds: [
      "src-lengel-halt-001",
      "src-dunkirk-wiki-001"
    ]
  },
  seedSelection: {
    aftermath: 2,
    decade: 2,
    present: 1
  },
  consequenceSeeds: [
    {
      id: "nh-a1",
      horizon: "aftermath",
      title: "A hotter perimeter",
      summary: "In this branch, German armour presses the Dunkirk perimeter while Operation Dynamo is still getting started, when only 7,669 soldiers were lifted on the first day. The evacuation would have had to run under far heavier ground pressure than the historical pause allowed.",
      classification: "plausible-projection",
      basis: "The halt order paused armoured pressure on the perimeter in the early days, and Dynamo's first day lifted only 7,669 men.",
      evidenceIds: [
        "src-dunkirk-wiki-001",
        "src-lengel-halt-001"
      ],
      causalFactorIds: [
        "evacuation-capacity"
      ]
    },
    {
      id: "nh-a2",
      horizon: "aftermath",
      title: "More of the army lost",
      summary: "In this branch, fewer than the 338,226 men rescued historically escape, and the number of British soldiers killed or captured grows beyond the roughly 68,000 the BEF lost over the whole campaign.",
      classification: "plausible-projection",
      basis: "About 338,226 were rescued and about 68,000 were lost historically; a perimeter under armoured attack would shrink the first figure and raise the second.",
      evidenceIds: [
        "src-historic-england-001"
      ],
      causalFactorIds: [
        "evacuation-capacity",
        "allied-trained-force"
      ]
    },
    {
      id: "nh-a3",
      horizon: "aftermath",
      title: "A shortage of trained men",
      summary: "In this branch, Britain's pre-war regular army, including the large numbers of trained officers and men who were in France, is hit harder. With the loss of its heavy equipment already certain, the army that faces the summer of 1940 is smaller and less experienced.",
      classification: "plausible-projection",
      basis: "War Cabinet ministers feared that losing the regulars in France, together with all heavy equipment, would be a bitter blow to Britain's prospects.",
      evidenceIds: [
        "src-museum-pm-001",
        "src-historic-england-001"
      ],
      causalFactorIds: [
        "allied-trained-force"
      ]
    },
    {
      id: "nh-d1",
      horizon: "decade",
      title: "Rebuilding from a smaller base",
      summary: "A smaller and less experienced army coming home would likely slow Britain's rebuilding of its land forces after 1940, delaying how soon it could contribute ground troops against Germany.",
      classification: "plausible-projection",
      basis: "Reasoned extension of the loss of trained regulars that ministers feared in May 1940.",
      evidenceIds: [
        "src-museum-pm-001",
        "src-historic-england-001"
      ],
      causalFactorIds: [
        "allied-trained-force"
      ]
    },
    {
      id: "nh-d2",
      horizon: "decade",
      title: "A harder political summer",
      summary: "A heavier defeat on the beaches would likely have strengthened those in the British government who wanted to explore a negotiated peace, and would have tested Churchill's position in the weeks after Dunkirk.",
      classification: "plausible-projection",
      basis: "On 28 May Halifax argued that Britain might get better terms before France left the war and aircraft factories were bombed; a worse military outcome strengthens that case.",
      evidenceIds: [
        "src-museum-pm-001"
      ],
      causalFactorIds: [
        "british-political-resolve"
      ]
    },
    {
      id: "nh-d3",
      horizon: "decade",
      title: "Invasion fears with fewer defenders",
      summary: "With less of its army recovered, Britain would have faced the summer's fear of invasion with fewer trained ground forces to defend the home islands.",
      classification: "plausible-projection",
      basis: "The War Cabinet could not rule out an invasion of Britain once France fell.",
      evidenceIds: [
        "src-museum-pm-001"
      ],
      causalFactorIds: [
        "allied-trained-force"
      ]
    },
    {
      id: "nh-p1",
      horizon: "present",
      title: "A smaller part in the Grand Alliance",
      summary: "Over the decades, a Britain that came out of 1940 with a diminished army might have played a smaller part in the Allied war effort, and in the world that followed, than the Britain that actually fought on and helped form a Grand Alliance with the United States and the Soviet Union.",
      classification: "highly-speculative",
      basis: "Grimsley notes that Britain fought on and helped create the Grand Alliance; this seed asks how a weaker start might have shifted that role.",
      evidenceIds: [
        "src-grimsley-peace-001"
      ],
      causalFactorIds: []
    },
    {
      id: "nh-p2",
      horizon: "present",
      title: "A different national memory",
      summary: "The rescue is remembered as the Miracle of Dunkirk and has become a central story of British resilience. In this branch there may have been no such story, and the national memory of 1940, and what Britons expect of themselves in a crisis, could look very different today.",
      classification: "highly-speculative",
      basis: "Both the Historic England and Wikipedia accounts describe the evacuation as the Miracle of Dunkirk.",
      evidenceIds: [
        "src-historic-england-001",
        "src-dunkirk-wiki-001"
      ],
      causalFactorIds: []
    }
  ]
};

export const reducedEvacuationPivot = {
  plausibility: {
    minimalRewrite: "Operation Dynamo was authorized only on 26 May, and its early results were poor: 7,669 men on the first day and about 17,000 by 28 May. The final total of more than 338,000 exceeded expectations, so modestly less shipping, a shorter holding period, or worse early luck would not have required any change to the military situation.",
    evidenceIds: [
      "src-museum-pm-001",
      "src-dunkirk-wiki-001",
      "src-grimsley-peace-001",
      "src-ebsco-dunkirk-001"
    ]
  },
  seedSelection: {
    aftermath: 2,
    decade: 2,
    present: 1
  },
  consequenceSeeds: [
    {
      id: "he-a1",
      horizon: "aftermath",
      title: "Fewer men reach England",
      summary: "In this branch, fewer ships or fewer days mean far fewer than the 338,226 men rescued historically, and the army that reaches Britain after Dunkirk is correspondingly smaller.",
      classification: "plausible-projection",
      basis: "The historical total depended on the number of vessels and days available to lift men from the beaches and harbour.",
      evidenceIds: [
        "src-dunkirk-wiki-001",
        "src-historic-england-001"
      ],
      causalFactorIds: [
        "evacuation-capacity"
      ]
    },
    {
      id: "he-a2",
      horizon: "aftermath",
      title: "The trained cadre thins",
      summary: "Many of the men left behind would come from Britain's pre-war regular army, large numbers of whom were in France, deepening the loss of trained officers and men that ministers feared.",
      classification: "plausible-projection",
      basis: "War Cabinet ministers noted that much of the pre-war regular army was in France.",
      evidenceIds: [
        "src-museum-pm-001"
      ],
      causalFactorIds: [
        "allied-trained-force"
      ]
    },
    {
      id: "he-a3",
      horizon: "aftermath",
      title: "More Allied soldiers left behind",
      summary: "Of the roughly 338,000 men rescued historically, about 224,000 were British. A smaller evacuation would likely have left more Allied soldiers behind, including French troops.",
      classification: "plausible-projection",
      basis: "The French army held the collapsing perimeter and few French soldiers escaped even in the historical evacuation.",
      evidenceIds: [
        "src-ebsco-dunkirk-001",
        "src-museum-pm-001"
      ],
      causalFactorIds: [
        "evacuation-capacity",
        "french-resistance-continuity"
      ]
    },
    {
      id: "he-d1",
      horizon: "decade",
      title: "A slower army rebuild",
      summary: "With a smaller rescued army, Britain's land forces would have taken longer to regrow and re-equip, delaying any return to the Continent and putting more weight on air and naval power in the war's middle years.",
      classification: "plausible-projection",
      basis: "The BEF abandoned nearly all its heavy equipment, so manpower was the scarce asset that Dunkirk preserved.",
      evidenceIds: [
        "src-museum-pm-001",
        "src-historic-england-001"
      ],
      causalFactorIds: [
        "allied-trained-force"
      ]
    },
    {
      id: "he-d2",
      horizon: "decade",
      title: "Washington's confidence",
      summary: "A disappointing rescue might have lowered American confidence that Britain could survive, and with it Washington's willingness to risk resources on a country it expected to lose.",
      classification: "plausible-projection",
      basis: "War Cabinet ministers worried that if the Americans thought British defeat inevitable they would not throw good money after bad.",
      evidenceIds: [
        "src-museum-pm-001"
      ],
      causalFactorIds: [
        "british-political-resolve"
      ]
    },
    {
      id: "he-d3",
      horizon: "decade",
      title: "More weight on the air battle",
      summary: "With fewer trained ground troops, the defence of the home islands in 1940 would have leaned even more heavily on denying Germany air superiority, raising the stakes of the coming Battle of Britain.",
      classification: "plausible-projection",
      basis: "The Chief of the Air Staff told ministers the key was preventing German air superiority that would enable an invasion, and Dowding was conserving fighters for that fight.",
      evidenceIds: [
        "src-museum-pm-001",
        "src-dowding-001"
      ],
      causalFactorIds: [
        "raf-fighter-reserve"
      ]
    },
    {
      id: "he-p1",
      horizon: "present",
      title: "A different postwar Britain",
      summary: "A Britain that lost more of its army in 1940 might have emerged from the war with less standing among the victors, changing its place in the world today.",
      classification: "highly-speculative",
      basis: "Grimsley records that Britain fought on and ended the war having lost its empire and status as a world power anyway; a weaker start might have changed the path.",
      evidenceIds: [
        "src-grimsley-peace-001"
      ],
      causalFactorIds: []
    },
    {
      id: "he-p2",
      horizon: "present",
      title: "A different transatlantic bargain",
      summary: "The balance of the partnership between Britain and the United States might have developed differently today if Britain had reached 1941 weaker.",
      classification: "highly-speculative",
      basis: "Grimsley's account ties American support to Britain's visible will and ability to keep fighting.",
      evidenceIds: [
        "src-grimsley-peace-001"
      ],
      causalFactorIds: []
    }
  ]
};

export const cabinetNegotiatesChoice = {
  id: "war-cabinet-negotiates",
  label: "Cabinet explores peace",
  description: "On 28 May Churchill fails to carry the War Cabinet, and Lord Halifax's proposal to explore terms through Mussolini goes ahead.",
  interventionSummary: "The War Cabinet authorizes an approach to Italy to explore a settlement instead of rejecting mediation, while the Dunkirk evacuation proceeds as recorded.",
  narrativeEvents: [
    {
      id: "evt-pivot-cabinet-negotiates",
      date: "1940-05-28",
      title: "The Cabinet explores terms",
      summary: "In this counterfactual branch, Churchill fails to carry the War Cabinet on 28 May 1940. Lord Halifax, who had argued that Britain should consider terms from Mussolini if they left its independence intact, and who had suggested he might resign, prevails, and the Cabinet authorizes an approach to Italy to explore a general settlement instead of rejecting mediation.",
      classification: "plausible-projection",
      evidenceIds: [
        "src-museum-pm-001",
        "src-war-cabinet-001"
      ],
      causalFactorIds: [
        "british-political-resolve"
      ]
    }
  ],
  plausibility: {
    minimalRewrite: "Churchill had been prime minister for less than a month and could not simply overrule his colleagues. Halifax had been the Conservative grandees' other candidate for the premiership, he told a senior official that he could no longer work with Churchill, and Chamberlain, who held the balance in the Cabinet, argued on 27 May that the response to Mussolini should not be a complete rejection. Historian Ian Kershaw, as summarized by Mark Grimsley, treats the decision not to seek negotiations as a genuine fork.",
    evidenceIds: [
      "src-museum-pm-001",
      "src-grimsley-peace-001",
      "src-war-cabinet-001"
    ]
  },
  seedSelection: {
    aftermath: 2,
    decade: 2,
    present: 1
  },
  consequenceSeeds: [
    {
      id: "wc-a1",
      horizon: "aftermath",
      title: "Mussolini as intermediary",
      summary: "In this branch, Britain approaches Italy to explore a general settlement. The Cabinet assumed Mussolini would want concessions in the Mediterranean in return for mediating, and Churchill estimated Italy might seek the neutralization of Gibraltar and the Suez Canal, the demilitarization of Malta, and limits on British warships in the Mediterranean.",
      classification: "plausible-projection",
      basis: "Grimsley reports the Cabinet's assumptions and Churchill's estimate of Italian demands.",
      evidenceIds: [
        "src-grimsley-peace-001",
        "src-museum-pm-001"
      ],
      causalFactorIds: [
        "british-political-resolve"
      ]
    },
    {
      id: "wc-a2",
      horizon: "aftermath",
      title: "The price from Berlin",
      summary: "Kershaw argues that to make sure Britain did not renege, Hitler would have insisted on the return of the colonies taken from Germany after the First World War and on concessions designed to hobble the Royal Navy.",
      classification: "plausible-projection",
      basis: "Grimsley summarizes Kershaw's reasoning about the terms Hitler would have demanded.",
      evidenceIds: [
        "src-grimsley-peace-001"
      ],
      causalFactorIds: [
        "british-political-resolve"
      ]
    },
    {
      id: "wc-a3",
      horizon: "aftermath",
      title: "A coalition under strain",
      summary: "A Cabinet decision to explore terms would have strained a coalition in which Labour ministers such as Attlee and Greenwood warned that approaches looking like a plea for terms would be disastrous, and Churchill's own position, less than a month old, could have been put in jeopardy.",
      classification: "plausible-projection",
      basis: "The minutes record Greenwood warning of terrible consequences if it got out that Britain had sued for terms, and Halifax's resignation would have triggered a political crisis.",
      evidenceIds: [
        "src-museum-pm-001"
      ],
      causalFactorIds: [
        "british-political-resolve"
      ]
    },
    {
      id: "wc-d1",
      horizon: "decade",
      title: "Hitler turns east",
      summary: "A settlement with Britain would have freed Hitler to turn all of his military might against the Soviet Union.",
      classification: "plausible-projection",
      basis: "Grimsley reports this as Hitler's perspective in Kershaw's account.",
      evidenceIds: [
        "src-grimsley-peace-001"
      ],
      causalFactorIds: [
        "british-political-resolve"
      ]
    },
    {
      id: "wc-d2",
      horizon: "decade",
      title: "Washington steps back",
      summary: "A negotiated settlement would likely have extinguished President Roosevelt's interest in supporting Britain, and he would reasonably have turned his full attention to the defence of North America.",
      classification: "plausible-projection",
      basis: "Grimsley summarizes Kershaw's judgment about Roosevelt's likely reaction.",
      evidenceIds: [
        "src-grimsley-peace-001",
        "src-museum-pm-001"
      ],
      causalFactorIds: [
        "british-political-resolve"
      ]
    },
    {
      id: "wc-d3",
      horizon: "decade",
      title: "An enfeebled Britain",
      summary: "In the short term a settlement might have preserved the British Empire, but it would have enfeebled Britain.",
      classification: "plausible-projection",
      basis: "Grimsley summarizes Kershaw on the short-term and long-term effects of a settlement.",
      evidenceIds: [
        "src-grimsley-peace-001"
      ],
      causalFactorIds: [
        "british-political-resolve"
      ]
    },
    {
      id: "wc-p1",
      horizon: "present",
      title: "No Grand Alliance",
      summary: "In the actual timeline Britain fought on, helped create a Grand Alliance with the United States and the Soviet Union, and paid with 450,000 military and civilian deaths and eventually its empire and status as a world power. In this branch that alliance might never have formed in the same way, and Europe today could look unrecognizably different.",
      classification: "highly-speculative",
      basis: "Grimsley describes what actually happened when Britain fought on.",
      evidenceIds: [
        "src-grimsley-peace-001"
      ],
      causalFactorIds: []
    },
    {
      id: "wc-p2",
      horizon: "present",
      title: "A Europe in Germany's shadow",
      summary: "Especially given a Nazi triumph over the Soviet Union, it is unlikely in Kershaw's reading that Britain would have kept its empire or escaped eventual invasion, and the political map of Europe today might reflect German dominance.",
      classification: "highly-speculative",
      basis: "Grimsley summarizes Kershaw's long-term assessment.",
      evidenceIds: [
        "src-grimsley-peace-001"
      ],
      causalFactorIds: []
    }
  ]
};
