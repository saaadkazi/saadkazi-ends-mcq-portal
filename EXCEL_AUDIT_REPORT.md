# Excel Source Data Audit Report: `Entrepreneurship_Development_100_MCQs (1) (1).xlsx`

## 1. Executive Summary & Final Verdict

- **Audit Date**: 2026-10-25
- **File Path**: `EXCEL_SHEET/Entrepreneurship_Development_100_MCQs (1) (1).xlsx`
- **Total Records Inspected**: 100 of 100
- **Final Verdict**: **PASS** (100/100 records structurally and semantically verified)
- **Key Strategic Observation**: In the raw source file, Option B is designated as the correct answer in 77% of questions (`B: 77`, `A: 14`, `C: 9`, `D: 0`). Runtime option shuffling (as defined in `ARCHITECTURE.md`) is therefore essential to prevent order-bias exploitation.

---

## 2. Workbook Structure & Column Mapping

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Sheet Name** | `ED_100_MCQs` | Single active worksheet |
| **Total Rows** | 101 | 1 Header row + 100 Data rows |
| **Total Columns** | 7 | Exact 7-column schema |
| **Extra Rows / Columns** | None | Zero phantom or orphaned rows/columns detected |

### Column Schema Mapping

| Column # | Excel Header | Target Field in `Question` Schema | Data Type | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Sr. No.` | `id` | Integer (1-100) | Continuous, sequential, no gaps |
| 2 | `Question` | `question` | String | Well-formed question statements |
| 3 | `Option A` | `options[0]` (id: 'A') | String | Clean text, no truncation |
| 4 | `Option B` | `options[1]` (id: 'B') | String | Clean text, no truncation |
| 5 | `Option C` | `options[2]` (id: 'C') | String | Clean text, no truncation |
| 6 | `Option D` | `options[3]` (id: 'D') | String | Clean text, no truncation |
| 7 | `Correct Answer` | `correctOptionId` | String ('A'-'D') | Validated uppercase keys |

---

## 3. Validation Results & Issue Metrics

| Audit Metric | Expected | Actual Found | Status |
| :--- | :---: | :---: | :---: |
| Total Question Records | 100 | 100 | PASS |
| Serial Numbers (Continuous 1–100) | 1 to 100 | 1 to 100 | PASS |
| Missing Question Texts | 0 | 0 | PASS |
| Missing Options (A, B, C, or D) | 0 | 0 | PASS |
| Missing Correct Answer Keys | 0 | 0 | PASS |
| Invalid Answer Keys (outside A-D) | 0 | 0 | PASS |
| Duplicate Serial Numbers | 0 | 0 | PASS |
| Duplicate Question Statements | 0 | 0 | PASS |
| Duplicate Options within Same Question | 0 | 0 | PASS |
| Trailing/Leading Whitespace Irregularities | 0 | 0 | PASS |
| Truncated or Malformed Text Fields | 0 | 0 | PASS |

### Answer Key Distribution in Raw Workbook

- **Option A**: 14 (14.0%)
- **Option B**: 77 (77.0%)
- **Option C**: 9 (9.0%)
- **Option D**: 0 (0.0%)

> [!IMPORTANT]
> **Data Skew Note**: The original author placed the correct answer primarily in Option B (77/100). The runtime Fisher-Yates option shuffler specified in `ARCHITECTURE.md` perfectly decouples option display from this underlying skew by assigning stable IDs (`A`, `B`, `C`, `D`) and randomizing visual position at runtime. No answers need to be altered.

---

## 4. Record-by-Record Audit Table (All 100 Questions)

| Sr. No. | Question Prompt (Snippet) | Correct Key | Correct Option Text (Snippet) | Audit Verdict |
| :---: | :--- | :---: | :--- | :---: |
| 1 | Which of the following is considered an intrinsic reward (charm) ... | **C** | High degree of autonomy and decision-making i... | `PASS` |
| 2 | The scope of an enterprise targeting exclusively local geographic... | **C** | Local purchasing power and narrow consumer de... | `PASS` |
| 3 | An entrepreneur who continues to pursue market validation despite... | **B** | Persistence | `PASS` |
| 4 | An entrepreneur conducting extensive customer interviews and comp... | **B** | Information seeking | `PASS` |
| 5 | How does a 'calculated risk-taker' differ from a 'gambler'? | **B** | A calculated risk-taker assesses probabilitie... | `PASS` |
| 6 | Which entrepreneurial trait involves standing firm on business te... | **A** | Assertiveness | `PASS` |
| 7 | A business entity that purchases finished goods from producers in... | **C** | Trading (Wholesale) enterprise | `PASS` |
| 8 | Which of the following operations is classified under a 'Service ... | **B** | Mobile phone repair and software troubleshoot... | `PASS` |
| 9 | A manufacturing enterprise is characterized by: | **A** | Physical transformation of raw materials into... | `PASS` |
| 10 | What is a key disadvantage faced by an entrepreneur during the ea... | **B** | Financial uncertainty and irregular cash flow | `PASS` |
| 11 | Which enterprise type typically carries the highest inventory spo... | **B** | Perishable food manufacturing and distributio... | `PASS` |
| 12 | When an entrepreneur learns from failures, the primary behavioral... | **C** | Root-cause post-mortem analysis followed by s... | `PASS` |
| 13 | 'Commitment to work contract' in an entrepreneurial setting means... | **B** | Prioritizing customer delivery and specificat... | `PASS` |
| 14 | The scope of a global enterprise is enabled primarily by: | **B** | Digital connectivity, scalable logistics, and... | `PASS` |
| 15 | An entrepreneur negotiating payment terms with suppliers without ... | **B** | Persuasion and business communication | `PASS` |
| 16 | Which of the following is an example of strategic risk in a start... | **B** | Entering a saturated market with an obsolete ... | `PASS` |
| 17 | A trading enterprise generally requires: | **B** | Working capital for inventory and efficient d... | `PASS` |
| 18 | Self-analysis tools such as SWOT analysis help prospective entrep... | **B** | Internal strengths/weaknesses and external op... | `PASS` |
| 19 | In contrast to an employee, an entrepreneur's financial returns a... | **B** | Residual, uncapped, and performance-dependent | `PASS` |
| 20 | An entrepreneur demonstrating 'Initiative' is one who: | **B** | Takes proactive actions before being forced t... | `PASS` |
| 21 | Which risk type stems directly from fluctuations in interest rate... | **B** | Financial risk | `PASS` |
| 22 | A service enterprise differs from a manufacturing enterprise prim... | **B** | Intangible, inseparable, variable, and perish... | `PASS` |
| 23 | Creative problem solving in entrepreneurship helps founders: | **B** | Identify novel, resource-efficient solutions ... | `PASS` |
| 24 | Independent decision-making requires an entrepreneur to: | **B** | Assume sole responsibility for directional ch... | `PASS` |
| 25 | Technological obsolescence is a major risk categorized under: | **A** | Operational/Technical risk | `PASS` |
| 26 | An organization's unique bundle of skills, technologies, and proc... | **B** | Core competence | `PASS` |
| 27 | What is the correct sequence of stages in the standard Product Li... | **B** | Introduction -> Growth -> Maturity -> Decline | `PASS` |
| 28 | In the Product Mortality Curve, the sharpest reduction in ideas o... | **B** | Initial idea screening and concept evaluation | `PASS` |
| 29 | Which stage of the Technology Life Cycle (TLC) requires maximum R... | **A** | Bleeding Edge / Research & Development phase | `PASS` |
| 30 | Which factor is most critical when selecting an industrial locati... | **B** | Proximity to limestone raw material reserves ... | `PASS` |
| 31 | In a manufacturing plant, efficient 'Material Handling' layout pr... | **B** | Minimize material travel time, bottlenecks, a... | `PASS` |
| 32 | What is the primary purpose of a pilot questionnaire test in a ma... | **B** | Identifying ambiguous, confusing, or leading ... | `PASS` |
| 33 | Sampling where every individual in the defined population has a k... | **C** | Probability / Random sampling | `PASS` |
| 34 | What does the acronym MCED stand for in Maharashtra's industrial ... | **B** | Maharashtra Centre for Entrepreneurship Devel... | `PASS` |
| 35 | NI-MSME (National Institute for Micro, Small and Medium Enterpris... | **B** | Hyderabad | `PASS` |
| 36 | Under the PMEGP scheme, what is the key financial mechanism provi... | **B** | Credit-linked capital subsidy for project set... | `PASS` |
| 37 | What is the nodal implementing agency for the PMEGP scheme at the... | **B** | Khadi and Village Industries Commission (KVIC... | `PASS` |
| 38 | The District Industries Centre (DIC / DI) operates primarily to: | **B** | Provide single-window facilitation, registrat... | `PASS` |
| 39 | Primary market research data is collected through: | **B** | Directly administered surveys, interviews, an... | `PASS` |
| 40 | Which transformation cost includes depreciation of plant machiner... | **B** | Conversion / Manufacturing overhead cost | `PASS` |
| 41 | In the New Product Development (NPD) funnel, what stage immediate... | **B** | Concept Development and Testing | `PASS` |
| 42 | Which location factor dominates for an e-commerce fast-delivery g... | **B** | Dense urban neighborhood proximity to optimiz... | `PASS` |
| 43 | What is a 'Closed-ended question' in a market survey questionnair... | **B** | A question with predefined, standardized resp... | `PASS` |
| 44 | A continuous process manufacturing layout is best suited for: | **B** | Standardized chemical petroleum refining and ... | `PASS` |
| 45 | Which agency promotes non-farm, rural, and traditional craft-base... | **B** | KVIC | `PASS` |
| 46 | Qualitative data analysis in market research focuses on: | **B** | Consumer sentiments, perceptions, underlying ... | `PASS` |
| 47 | When selecting a product, the 'degree of value addition' represen... | **B** | The difference between the cost of raw materi... | `PASS` |
| 48 | In the Maturity stage of the Product Life Cycle, marketing strate... | **B** | Defending market share, brand differentiation... | `PASS` |
| 49 | Which of the following is an example of a convenience sampling me... | **B** | Interviewing passersby at an entrance of an a... | `PASS` |
| 50 | Innovation in product modification involves: | **B** | Improving functional utility, energy efficien... | `PASS` |
| 51 | According to the revised composite criteria (effective from 2020)... | **A** | Investment <= Rs 1 Crore and Annual Turnover ... | `PASS` |
| 52 | Under the MSME categorization criteria, what are the thresholds f... | **B** | Investment <= Rs 10 Crore and Turnover <= Rs ... | `PASS` |
| 53 | What are the composite classification thresholds for a 'Medium' e... | **B** | Investment <= Rs 50 Crore and Turnover <= Rs ... | `PASS` |
| 54 | In the calculation of annual turnover for MSME classification, wh... | **B** | Export turnover of goods and services | `PASS` |
| 55 | An 'Ancillary Industrial Unit' is predominantly characterized by: | **B** | Supplying a substantial percentage (typically... | `PASS` |
| 56 | What is the fundamental formula to calculate the Break-Even Point... | **B** | BEP (units) = Fixed Costs / (Selling Price pe... | `PASS` |
| 57 | The difference between the Selling Price per Unit and the Variabl... | **B** | Unit contribution margin | `PASS` |
| 58 | If a company incurs Rs 2,00,000 in Fixed Costs, has a Selling Pri... | **B** | 10,000 units | `PASS` |
| 59 | What does the Break-Even Point represent for an enterprise? | **B** | The sales level where total revenue exactly e... | `PASS` |
| 60 | How is Return on Investment (ROI) calculated? | **A** | ROI = (Net Annual Profit / Total Cost of Inve... | `PASS` |
| 61 | If an entrepreneur invests Rs 10,00,000 into a manufacturing unit... | **C** | 25% | `PASS` |
| 62 | Return on Sales (ROS) measures an enterprise's: | **B** | Operating efficiency by calculating profit ge... | `PASS` |
| 63 | What is the mathematical representation of Return on Sales (ROS)? | **A** | (Net Operating Profit / Net Sales Revenue) * ... | `PASS` |
| 64 | If an enterprise records annual net sales of Rs 50,00,000 and gen... | **B** | 10% | `PASS` |
| 65 | The official portal initiated by the Ministry of MSME for online ... | **B** | Udyam Registration Portal | `PASS` |
| 66 | Which national agency provides support for technical consultation... | **A** | National Small Industries Corporation (NSIC) ... | `PASS` |
| 67 | What is the primary role of SIDBI (Small Industries Development B... | **B** | Principal financial institution for promoting... | `PASS` |
| 68 | An enterprise that reduces its fixed costs while maintaining the ... | **B** | A lower break-even point (reaches profitabili... | `PASS` |
| 69 | Which agency offers dedicated support for testing and quality cer... | **A** | Bureau of Indian Standards (BIS) | `PASS` |
| 70 | A major benefit enjoyed by registered MSMEs under public procurem... | **B** | Mandatory minimum percentage procurement quot... | `PASS` |
| 71 | If an enterprise sells products above its Break-Even Point, the a... | **B** | Net Operating Profit | `PASS` |
| 72 | The 'Margin of Safety' in break-even analysis refers to: | **B** | The difference between actual/projected sales... | `PASS` |
| 73 | A high ROS accompanied by a declining ROI usually points toward: | **B** | Inefficient use of heavy capital assets relat... | `PASS` |
| 74 | Support provided by MSME Testing Centres (TCs) includes: | **B** | Providing specialized precision testing, cali... | `PASS` |
| 75 | When an ancillary unit faces working capital lockups due to payme... | **A** | The MSMED Act Micro & Small Enterprise Facili... | `PASS` |
| 76 | What is the main objective of a Techno-Commercial Feasibility Stu... | **B** | To establish technical viability (engineering... | `PASS` |
| 77 | Which form of business ownership provides limited liability prote... | **C** | Limited Liability Partnership (LLP) | `PASS` |
| 78 | In a Sole Proprietorship, the owner's liability for business debt... | **B** | Unlimited, extending to personal assets and p... | `PASS` |
| 79 | What does the Unique Selling Proposition (USP) of an enterprise s... | **B** | The distinctive feature, benefit, or design t... | `PASS` |
| 80 | The 4 Ps of a classic Marketing Mix framework are: | **B** | Product, Price, Place, Promotion | `PASS` |
| 81 | An Executive Summary in a formalized Business Plan should be writ... | **B** | Last, synthesizing the core highlights, busin... | `PASS` |
| 82 | A Capital Budgeting decision typically involves: | **B** | Long-term investment decisions regarding heav... | `PASS` |
| 83 | In business negotiations, the BATNA principle stands for: | **A** | Best Alternative To a Negotiated Agreement | `PASS` |
| 84 | Which negotiation technique involves splitting contentious packag... | **B** | Fractional / Logrolling bargaining | `PASS` |
| 85 | How do Angel Investors differ from Venture Capital (VC) firms? | **B** | Angel investors are typically high-net-worth ... | `PASS` |
| 86 | What is the fundamental difference between an Incubation Center a... | **B** | Incubators nurture early-stage ideas over lon... | `PASS` |
| 87 | Atal Incubation Centres (AICs) have been established across India... | **A** | NITI Aayog's Atal Innovation Mission (AIM) | `PASS` |
| 88 | A working capital budget estimates: | **B** | Short-term cash inflows and outflows required... | `PASS` |
| 89 | In risk management, the strategy of purchasing insurance against ... | **C** | Risk transference | `PASS` |
| 90 | The concept of 'Bootstrapping' a startup means: | **B** | Financing business launch and operations enti... | `PASS` |
| 91 | What is the 'Burn Rate' of a venture? | **B** | The rate at which an early-stage company spen... | `PASS` |
| 92 | A 'Pivot' by a startup refers to: | **B** | Making a structured course correction to the ... | `PASS` |
| 93 | A competitive advantage based on 'Cost Leadership' focuses on: | **B** | Achieving the lowest operational and manufact... | `PASS` |
| 94 | What is a 'Term Sheet' presented by a venture capitalist? | **B** | A non-binding preliminary agreement outlining... | `PASS` |
| 95 | Which of the following is considered an equity financing route? | **C** | Issuing common shares to Angel Investors in e... | `PASS` |
| 96 | A market penetration pricing strategy involves: | **A** | Setting an initially low price to attract lar... | `PASS` |
| 97 | In a Private Limited Company, what restriction is placed on owner... | **B** | Share transfers are restricted per company Ar... | `PASS` |
| 98 | What is the role of an Angel Network/Syndicate? | **B** | Pooling capital, due diligence expertise, and... | `PASS` |
| 99 | What does the 'Runway' of a startup describe? | **B** | The number of months a startup can continue o... | `PASS` |
| 100 | In business planning, sensitivity analysis evaluates: | **A** | How variations in key assumptions (e.g., sale... | `PASS` |

---

## 5. Items Requiring Manual Verification

After inspecting all 100 individual questions, options, and designated answers, **0 items have syntax, data, or integrity defects**.

All calculations in numerical questions were re-verified:
- **Q51** (MSME Micro limits): Rs 1 Cr Investment, Rs 5 Cr Turnover $\rightarrow$ Correct (`A`)
- **Q52** (MSME Small limits): Rs 10 Cr Investment, Rs 50 Cr Turnover $\rightarrow$ Correct (`B`)
- **Q53** (MSME Medium limits): Rs 50 Cr Investment, Rs 250 Cr Turnover $\rightarrow$ Correct (`B`)
- **Q54** (MSME Export turnover exclusion): Export turnover excluded $\rightarrow$ Correct (`B`)
- **Q56** (Break-Even formula): $\text{BEP} = \text{Fixed Costs} / \text{Unit Contribution Margin} \rightarrow$ Correct (`B`)
- **Q58** (Break-Even computation): $\text{Fixed Costs}=\text{Rs }2,00,000, \text{Price}=\text{Rs }50, \text{Variable Cost}=\text{Rs }30 \rightarrow \text{BEP} = 200000 / 20 = 10,000 \text{ units} \rightarrow$ Correct (`B`)
- **Q60** (ROI formula): $(\text{Net Profit} / \text{Total Investment}) \times 100 \rightarrow$ Correct (`A`)
- **Q61** (ROI computation): $\text{Profit}=\text{Rs }2,50,000, \text{Investment}=\text{Rs }10,00,000 \rightarrow \text{ROI} = 25\% \rightarrow$ Correct (`C`)
- **Q63** (ROS formula): $(\text{Net Operating Profit} / \text{Net Sales}) \times 100 \rightarrow$ Correct (`A`)
- **Q64** (ROS computation): $\text{Sales}=\text{Rs }50,00,000, \text{Profit}=\text{Rs }5,00,000 \rightarrow \text{ROS} = 10\% \rightarrow$ Correct (`B`)

---

## 6. Phase 3 Ingestion Readiness

The raw Excel dataset is 100% verified, clean, and ready for ingestion into `src/data/questions.json` in Phase 3 without any manual text or answer corrections required.
