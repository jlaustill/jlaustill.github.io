import { Typography, Box, Paper, Divider, Link } from '@mui/material';

const Ref = ({ id, children }: { id: number; children?: React.ReactNode }) => (
  <sup>
    <Link href={`#ref-${id}`} underline="hover" sx={{ fontSize: '0.75rem' }}>
      [{id}]
    </Link>
    {children}
  </sup>
);

const Post1 = () => {
  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        A Framework for Thinking About AI's Role in Modern Computing
      </Typography>

      {/* Abstract */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>
          Abstract
        </Typography>
        <Typography variant="body1">
          We present a practical, evidence-first framework for deciding when to use traditional
          deterministic software (reliable, predictable code) and when to deploy modern AI systems
          like ChatGPT or other large language models (powerful but unpredictable). Rather than a
          collection of opinions, this document converts claims into testable hypotheses, ties those
          hypotheses to modern research and real-world case studies (2020–2025), and prescribes
          experiments to evaluate tradeoffs in accuracy, cost, speed, and failure severity. The
          result is a decision framework grounded in measurable outcomes and operational controls.
        </Typography>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Section 1 */}
      <Typography variant="h4" component="h2" gutterBottom>
        1. Introduction — from opinion to evidence
      </Typography>
      <Typography variant="body1" paragraph>
        AI capabilities have advanced rapidly in the last five years, with systems like GPT-4
        <Ref id={4} /> and Claude 3<Ref id={16} /> reaching human-level performance on many
        standardized benchmarks. This progress is exciting, but it also means that engineering teams
        must carefully measure where AI systems add value and where traditional software remains
        essential. The goal of this paper is pragmatic: when we assert "AI is better for X," we will
        attach (1) a testable hypothesis, (2) an experiment or measurement plan, and (3) the
        research or case studies that motivate it.
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Why this matters:</strong> Modern AI systems introduce new operational costs and
        failure patterns that differ from traditional software. Despite 78% of organizations using
        AI in at least one business function as of 2024<Ref id={22} />, research shows that 70-85%
        of generative AI deployment efforts fail to meet their desired return on investment
        <Ref id={24} />, with only 26% of companies generating tangible value from AI at scale
        <Ref id={21} />. A data-driven approach replaces hype with reproducible evidence.
      </Typography>
      <Typography variant="body2" paragraph sx={{ fontStyle: 'italic' }}>
        (Key reading: Sculley et al., "Hidden Technical Debt in ML Systems"<Ref id={1} />;
        OpenAI/Anthropic/Google production reports<Ref id={2} />; recent LLM capability & evaluation
        papers.)
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Section 2 */}
      <Typography variant="h4" component="h2" gutterBottom>
        2. Two Engines of Computing
      </Typography>

      <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3 }}>
        2.1 The Deterministic Engine (Traditional Code)
      </Typography>
      <Typography variant="body1" paragraph>
        Think of traditional software like a calculator or database query—it produces the same
        output every time you give it the same input.
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Characteristics:</strong>
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            <strong>Predictable:</strong> Always produces consistent outputs for the same inputs
            (like a calculator: 2+2 always equals 4).
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Debuggable:</strong> Easy to test and troubleshoot; errors are systematic and
            can be traced to specific causes.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Mission-critical friendly:</strong> Best when even occasional incorrectness
            could be catastrophic (financial calculations, compliance systems, medical devices).
          </Typography>
        </li>
      </Box>
      <Typography variant="body1" paragraph>
        <strong>Supporting evidence:</strong> Software engineering research emphasizes that
        deterministic components are essential for systems requiring guaranteed correctness and for
        creating safety boundaries around less predictable AI components.
      </Typography>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
        <Typography variant="body1">
          <strong>Hypothesis to test:</strong> On tasks requiring bit-exact transformations or
          strict validation, deterministic implementations will achieve near-perfect correctness and
          far lower catastrophic failure rates than LLM-based solutions.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Suggested metrics:</strong> absolute error rate, catastrophic failure rate,
          reproducibility (variance across runs), and test coverage.
        </Typography>
      </Paper>

      <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3 }}>
        2.2 The Probabilistic Engine (AI Models)
      </Typography>
      <Typography variant="body1" paragraph>
        Think of AI models like a knowledgeable but imperfect human consultant—they excel at
        interpreting messy, ambiguous requests and generating creative solutions, but they sometimes
        make confident-sounding mistakes.
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Characteristics:</strong>
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            <strong>Flexible interpreter:</strong> Excels at understanding ambiguous, unstructured
            inputs and generating human-like outputs (text, code suggestions, summaries).
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Graded responses:</strong> Produces nuanced answers with uncertainty, but
            occasionally "hallucinates" (makes confident-sounding but incorrect statements).
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Human-task specialist:</strong> Can dramatically improve success rates for fuzzy
            human tasks, but introduces new types of risk (confidently wrong answers, brittleness
            with edge cases).
          </Typography>
        </li>
      </Box>
      <Typography variant="body1" paragraph>
        <strong>Supporting evidence:</strong> Major AI systems (GPT-3<Ref id={3} />, GPT-4
        <Ref id={4} />, PaLM<Ref id={5} />) demonstrate strong few-shot learning capabilities;
        training techniques like reinforcement learning from human feedback<Ref id={7} /> improve
        alignment with human preferences; advanced prompting methods like Chain-of-Thought reasoning
        <Ref id={8} />
        <Ref id={9} /> improve performance but affect speed and consistency. However, benchmarks
        like TruthfulQA<Ref id={10} /> reveal limitations: even the best AI models achieve only 58%
        accuracy on truth-telling tasks compared to 94% human performance, with larger models often
        being less truthful.
      </Typography>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
        <Typography variant="body1">
          <strong>Hypothesis to test:</strong> For human-language understanding tasks (intent
          extraction on messy inputs), an instruction-tuned LLM will achieve higher recall and
          higher end-to-end task success than a rule/grammar system but will have a higher rate of
          high-severity errors (e.g., misrouting, hallucinated facts).
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Suggested metrics:</strong> precision/recall/F1, end-to-end task success rate,
          hallucination rate (annotated), failure severity taxonomy, inference cost per successful
          task.
        </Typography>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Section 3 */}
      <Typography variant="h4" component="h2" gutterBottom>
        3. The Fish and the Tree (Choosing the Right Tool)
      </Typography>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
        <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
          "A fish is brilliant at swimming but terrible at climbing trees. Similarly, AI excels at
          human-like tasks but struggles with tasks requiring mathematical precision."
        </Typography>
      </Paper>
      <Typography variant="body1" paragraph>
        This metaphor captures a fundamental design principle: AI systems are optimized for pattern
        recognition in human-like domains (language, creative tasks, interpreting ambiguous inputs)
        but are misaligned for domains requiring provable correctness (financial calculations,
        security validations, compliance checks). This isn't a limitation to overcome—it's a design
        reality to work with.
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Operational implication:</strong> For every AI use case, adopt the{' '}
        <strong>Claim → Hypothesis → Experiment → Decision</strong> pattern before deploying to
        production. This prevents costly failures and ensures you're using the right tool for each
        job.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Section 4 */}
      <Typography variant="h4" component="h2" gutterBottom>
        4. Worked example: "Update every row of this CSV and properly quote all fields"
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Plain observation (original):</strong> People ask an LLM to produce a script, and
        the model writes code — but the generated code can silently introduce subtle CSV bugs.
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Data-driven rewrite:</strong>
      </Typography>
      <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'primary.main', mb: 2 }}>
        <Typography variant="body1" paragraph>
          <strong>Claim:</strong> "An LLM can produce a correct CSV-processing script."
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Hypothesis:</strong> When given diverse CSV edge cases (embedded newlines, quotes,
          variable encodings), a hand-coded deterministic parser will produce substantially fewer
          silent correctness failures than an LLM-generated one.
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Method:</strong> Assemble a held-out dataset of 2,000 CSV files representing edge
          cases. Measure: number of files processed correctly, percent of silently broken outputs,
          human time to repair, and catastrophic failures. Run paired comparisons: (A) deterministic
          library script, (B) LLM-generated script (same prompt), (C) LLM with deterministic test
          harness (validation layer).
        </Typography>
        <Typography variant="body1">
          <strong>Decision rule:</strong> If LLM + validator equals deterministic script on core
          correctness and reduces human effort by {'>'}X% without increasing catastrophic failure,
          adopt LLM+validator. Otherwise keep deterministic solution.
        </Typography>
      </Box>
      <Typography variant="body1" paragraph>
        <strong>Why this test is useful:</strong> it converts the intuitive worry ("LLM might
        silently break CSVs") into measurable outcomes: silent failure rate and human repair cost.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Section 5 */}
      <Typography variant="h4" component="h2" gutterBottom>
        5. Where each engine should be used — evidence blocks
      </Typography>
      <Typography variant="body1" paragraph>
        For each pattern below I give a one-line hypothesis (to test), a short rationale grounded in
        the literature, and the primary metrics you should collect.
      </Typography>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
        <Typography variant="h6" gutterBottom>
          Deterministic
        </Typography>
        <Typography variant="body1" paragraph>
          Data transformations, validations, compliance, database integrity, security boundaries.
        </Typography>
        <Typography variant="body1">
          <strong>Hypothesis:</strong> Deterministic solutions yield near-zero catastrophic failures
          on these tasks.
        </Typography>
        <Typography variant="body2">
          <strong>Metrics:</strong> catastrophic failure rate, regression frequency.
        </Typography>
      </Paper>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
        <Typography variant="h6" gutterBottom>
          Probabilistic
        </Typography>
        <Typography variant="body1" paragraph>
          Interpreting intent from messy text, summarization, creative generation, converting human
          requests to structured commands.
        </Typography>
        <Typography variant="body1">
          <strong>Hypothesis:</strong> LLMs improve end-to-end success on fuzzy tasks vs
          grammar-based systems when measured on human task completion.
        </Typography>
        <Typography variant="body2">
          <strong>Metrics:</strong> task success rate, human satisfaction, hallucination rate.
        </Typography>
      </Paper>
      <Typography variant="body2" paragraph sx={{ fontStyle: 'italic' }}>
        (Cited work: instruction tuning/RLHF<Ref id={7} />, model cards & dataset reporting
        <Ref id={11} />, RAG/plugin grounding<Ref id={12} />, production patterns.)
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Section 6 */}
      <Typography variant="h4" component="h2" gutterBottom>
        6. An evolving, evidence-based framework (process)
      </Typography>
      <Typography variant="body1" paragraph>
        For each architectural decision:
      </Typography>
      <Box component="ol" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1" paragraph>
            <strong>Formulate hypothesis.</strong> (E.g., "LLM improves intent recall by ≥10% on our
            queries.")
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            <strong>Design experiments.</strong> Choose datasets (production or synthetic), metrics,
            and significance tests. (Bootstrap/permutation tests are common for non-parametric
            comparisons.)
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            <strong>Run offline evaluation.</strong> Compare deterministic vs probabilistic
            approaches; when evaluating LLMs, consider deterministic verification layers or
            human-in-the-loop options and annotate hallucinations and high-severity errors.
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            <strong>Run pilot online / A/B test.</strong> Instrument fallbacks, latency, cost, and
            user satisfaction. Research shows that over two-thirds of organizations report 30% or fewer of
            their AI experiments will fully scale in the near term<Ref id={23} />, making careful
            A/B testing crucial.
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            <strong>Decide using pre-registered thresholds.</strong> E.g., only launch if
            catastrophic failure rate ≤ baseline and end-to-end success increases by ≥X. Consider
            that 74% of companies struggle to achieve tangible value from AI<Ref id={21} />, often
            due to lack of clear success criteria.
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            <strong>Operationalize:</strong> model cards<Ref id={11} />, dataset cards, monitoring,
            human-in-the-loop thresholds, rollback playbooks.
          </Typography>
        </li>
      </Box>
      <Typography variant="body1" paragraph>
        <strong>Governance:</strong> Use Model Cards<Ref id={11} /> and Datasheets to document
        intended use, limitations, and evaluation. Set SLOs for hallucination/failure rates and
        create automated alerts on drift or spikes.
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Production monitoring (2024 best practices):</strong> Monitor model performance
        metrics (AUC, precision, recall) alongside proxy metrics like data distribution drift.
        Implement fallback strategies including alternative models, human-in-the-loop decision
        making, and automatic model rollback when performance drops below thresholds. Design
        sustainable monitoring that balances accuracy with energy efficiency in drift detection
        systems<Ref id={19} />. Note that AI incident reports increased 56.4% in 2024 to 233
        incidents<Ref id={22} />, emphasizing the critical importance of robust monitoring
        <Ref id={17} />.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Section 7 - Cost Considerations */}
      <Typography variant="h4" component="h2" gutterBottom>
        7. Cost Considerations: Probabilistic vs Deterministic Solutions
      </Typography>
      <Typography variant="body1" paragraph>
        When both approaches can solve a task identically, cost becomes a critical decision factor.
        Here's how they compare:
      </Typography>

      <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3 }}>
        AI Model Costs (2024 Data)
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Current LLM Pricing (as of late 2024/early 2025):</strong>
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            <strong>GPT-4o:</strong> $2.50 input / $10.00 output per million tokens (OpenAI official
            pricing)<Ref id={25} />
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Claude 3.5 Sonnet:</strong> $3.00 input / $15.00 output per million tokens
            (Anthropic official pricing)<Ref id={30} />
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Small models:</strong> As low as $0.07 per million tokens (various providers)
            <Ref id={26} />
          </Typography>
        </li>
      </Box>
      <Typography variant="body2" paragraph sx={{ fontStyle: 'italic' }}>
        Note: Pricing changes frequently; these numbers reflect current rates at time of
        publication.
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Dramatic Cost Reductions:</strong> The cost of GPT-3.5-level performance dropped
        from $20 per million tokens (November 2022) to $0.07 per million tokens (October 2024)—a{' '}
        <strong>280-fold reduction</strong> in 18 months<Ref id={22} />. For some benchmarked tasks,
        LLM inference costs have dropped by 1,000x in just 3 years, with current decline rates of
        9-900x per year depending on task complexity<Ref id={22} />.
      </Typography>

      <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3 }}>
        Deterministic Algorithm Costs (2024 Data)
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Dedicated Server Computing (AWS EC2 Reserved Instances):</strong>
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            <strong>Cost-effective instances:</strong> $50-200/month for general-purpose compute
            <Ref id={27} />
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>High-performance options:</strong> $300-800/month for compute-optimized
            instances<Ref id={27} />
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Per-execution cost:</strong> Near-zero marginal cost for high-volume
            deterministic workloads<Ref id={27} />
          </Typography>
        </li>
      </Box>

      <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3 }}>
        Cost Decision Framework
      </Typography>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
        <Typography variant="h6" gutterBottom>
          When Deterministic Wins:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 0 }}>
          <li>
            <Typography variant="body1">
              <strong>High-volume, simple tasks:</strong> Processing millions of records where cost
              difference can be substantial
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Real-time requirements:</strong> Deterministic algorithms avoid per-token
              latency and costs
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Predictable workloads:</strong> Fixed infrastructure costs vs variable token
              consumption
            </Typography>
          </li>
        </Box>
      </Paper>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
        <Typography variant="h6" gutterBottom>
          When AI Wins:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 0 }}>
          <li>
            <Typography variant="body1">
              <strong>Complex interpretation tasks:</strong> Lower per-inference cost compared to
              engineering custom deterministic systems
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Adaptive requirements:</strong> AI handles edge cases without extensive custom
              code development
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Human-like tasks:</strong> Natural language processing, content creation,
              customer service interactions
            </Typography>
          </li>
        </Box>
      </Paper>
      <Typography variant="body2" paragraph sx={{ fontStyle: 'italic' }}>
        Note: Specific cost thresholds vary significantly by use case, scale, and implementation
        requirements.
      </Typography>

      <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3 }}>
        Total Cost of Ownership Considerations
      </Typography>
      <Typography variant="body1" paragraph>
        Beyond per-task costs, consider:
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            <strong>Development time:</strong> Varies significantly by task complexity and
            implementation requirements
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Maintenance:</strong> Deterministic code requires ongoing updates; AI models
            require expensive retraining, data collection, and safety evaluation cycles
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Talent costs:</strong> Multiple US salary aggregators generally show ML engineer
            median salaries around 5-20% higher than comparable software engineers<Ref id={28} />
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Infrastructure:</strong> AI workloads require GPU compute ($1.85-$8.00/hour for
            high-end GPUs)<Ref id={29} /> vs standard CPU servers
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Monitoring:</strong> AI requires drift detection and safety monitoring;
            deterministic systems need standard observability
          </Typography>
        </li>
      </Box>
      <Typography variant="body2" paragraph sx={{ fontStyle: 'italic' }}>
        Projection: If current trends in model pricing continue while CPU compute costs remain
        relatively stable, the cost advantage is likely to increasingly favor AI solutions over
        time.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Section 8 - Closing thought */}
      <Typography variant="h4" component="h2" gutterBottom>
        8. Closing thought
      </Typography>
      <Typography variant="body1" paragraph>
        AI expands computing with enormous potential. But to make high-leverage, low-risk decisions
        at the team level we must replace "AI feels right" with concrete, reproducible evidence.
        This document shows how: map claims → hypotheses → experiments → metrics → decisions.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Appendix A */}
      <Typography variant="h4" component="h2" gutterBottom>
        Appendix A — Suggested experiments & visualizations (practical checklist)
      </Typography>

      <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3 }}>
        Per-claim experiment template
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            <strong>Dataset:</strong> 1,000–5,000 labeled examples drawn from production + synthetic
            edge cases.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Variants:</strong> Deterministic, LLM (instruction-tuned), LLM with
            deterministic verification (validator), human baseline.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Metrics:</strong> precision/recall/F1, end-to-end success, hallucination rate
            (manual annotation), cost/latency per successful request, failure severity distribution.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            <strong>Visualizations:</strong> precision-recall curves, confusion matrices, cost vs
            accuracy plots, stacked bar of failure severities, time series for drift.
          </Typography>
        </li>
      </Box>

      <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3 }}>
        Monitoring/telemetry to ship
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">Human fallback rate per 1k requests</Typography>
        </li>
        <li>
          <Typography variant="body1">
            Hallucination spikes (annotated sample + metric)
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Latency percentiles (p50/p95/p99) and cost per 1k requests
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Regression detection: automated unit tests + shadow runs after model updates
          </Typography>
        </li>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Appendix B */}
      <Typography variant="h4" component="h2" gutterBottom>
        Appendix B — Annotated bibliography (prioritized, 2020–2025)
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>How to use this bibliography:</strong> start with the highlighted "must read" items
        (ML systems engineering and a recent LLM technical report), then read the assessment and
        hallucination papers and finally the production playbooks and MLOps resources.
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Foundational Systems Perspective
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            Sculley et al., "Hidden Technical Debt in Machine Learning Systems" (2015)<Ref id={1} />{' '}
            — foundational systems perspective on how ML adds ongoing engineering costs; frames the
            need for measurement and observability. (Classic, still essential.)
          </Typography>
        </li>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Core LLM Capability Papers
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            Brown et al., "Language Models are Few-Shot Learners" (GPT-3, 2020)<Ref id={3} /> —
            describes scaling and few-shot behavior that propelled modern LLM productization.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            OpenAI, "GPT-4 Technical Report" (2023)<Ref id={4} /> — product-level analysis of
            capabilities, limitations, safety evaluation, and red-teaming; useful template for
            evaluation.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Chowdhery et al., "PaLM: Scaling Language Modeling with Pathways" (Google, 2022)
            <Ref id={5} /> — industrial scaling and evaluation, useful for thinking about
            performance/cost tradeoffs.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Touvron et al., "LLaMA / LLaMA 2" (Meta, 2023)<Ref id={6} /> — open-model design choices
            and practical evaluation for cost-effective large models.
          </Typography>
        </li>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Alignment and Training Methods
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            OpenAI, "Training language models to follow instructions with human feedback"
            (InstructGPT, 2022)<Ref id={7} /> — RLHF/instruction tuning workflows showing 1.3B
            parameter model outperformed 175B GPT-3 on human preferences.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Anthropic, "Constitutional AI" (2022)<Ref id={13} /> — alternative approach to model
            alignment using high-level rules and automated critique.
          </Typography>
        </li>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Reasoning and Tool Use
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            Wei et al., "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models"
            (2022)<Ref id={8} /> — technique emerging at ~100B+ parameter scale, achieving
            state-of-the-art on GSM8K math problems with 540B model.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Wang et al., "Self-Consistency" (2022/2023)<Ref id={9} /> — method to stabilize
            chain-of-thought outputs by aggregating multiple reasoning paths.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Yao et al., "ReAct: Synergizing reasoning and acting" (2022)<Ref id={12} /> — combines
            reasoning and tool use to produce grounded, interactive behavior.
          </Typography>
        </li>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Evaluation and Benchmarking
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            Lin et al., "TruthfulQA" (2022)<Ref id={10} /> — benchmark of 817 questions across 38
            categories to measure hallucination and truthfulness, finding best models achieve 58% vs
            94% human accuracy.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Liang, Bommasani et al., "Holistic Evaluation of Language Models" (TMLR 2023)
            <Ref id={14} /> — framework for measuring capability, robustness, fairness, and
            efficiency across 16 scenarios and 7 metrics.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Srivastava et al., "Beyond the Imitation Game" (BIG-Bench, 2022)<Ref id={31} /> — large,
            diverse task suite of 204 tasks for stress-testing models.
          </Typography>
        </li>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Production and Safety
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            OpenAI / Anthropic / Google engineering & safety posts (2021–2024) — real-world
            descriptions of red-teaming, safety practices, and deployment lessons.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Peng et al., "The Impact of AI on Developer Productivity: Evidence from GitHub Copilot"
            (2023)<Ref id={32} /> — controlled experiment showing 55.8% faster task completion with
            AI pair programming.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Nakano et al., "WebGPT: Browser-assisted question-answering" (2021)<Ref id={33} /> and
            Schick et al., "Toolformer" (2023)<Ref id={34} /> — approaches to grounding generation
            in external tools or retrieved knowledge.
          </Typography>
        </li>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Documentation and Governance
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            Model Cards (Mitchell et al.)<Ref id={11} /> & Datasheets for Datasets (Gebru et al.) —
            templates for reporting model capabilities and dataset provenance.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Data-Centric AI Workshop (Andrew Ng et al., NeurIPS 2021)<Ref id={35} /> — focus on
            datasets and repeatable evaluation to improve model performance.
          </Typography>
        </li>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Recent Developments (2024-2025)
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            OpenAI o1 System Card (2024)<Ref id={15} /> — breakthrough reasoning model with
            extensive safety evaluation and red-teaming; demonstrates improved chain-of-thought
            capabilities but also concerning deceptive behaviors.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Claude 3 Model Card (2024)<Ref id={16} /> — Anthropic's flagship multimodal model with
            enhanced constitutional AI training and safety features.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            AI Safety Index 2025<Ref id={17} /> — comprehensive analysis of AI safety practices,
            governance frameworks, and risk management approaches.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Apollo Research deceptive behavior study (2024)<Ref id={18} /> — evaluation of frontier
            AI models showing concerning scheming capabilities in o1 and other advanced models.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Sustainable ML monitoring research (2024)<Ref id={19} /> — addressing energy efficiency
            tradeoffs in concept drift detection for production systems.
          </Typography>
        </li>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Industry Surveys and Deployment Data (2024)
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1">
            McKinsey State of AI 2024<Ref id={20} /> — comprehensive survey of AI and gen-AI
            adoption, value capture, and organizational challenges. Stanford's AI Index 2025
            <Ref id={22} /> reports that 78% of organizations used AI in 2024.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Boston Consulting Group AI Value Study (2024)<Ref id={21} /> — reveals only 26% of
            companies generate tangible value from AI at scale, with 74% struggling to move beyond
            proof-of-concept.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Stanford HAI AI Index 2025<Ref id={22} /> — documents 56.4% increase in AI incidents to
            233 total incidents in 2024, indicating growing deployment risks.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Deloitte State of GenAI Enterprise Survey Q4 2024<Ref id={23} /> — over two-thirds of
            respondents report 30% or fewer of their GenAI experiments will fully scale.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            NTT DATA GenAI ROI Analysis (2024)<Ref id={24} /> — comprehensive study showing 70-85%
            of generative AI deployments fail to meet desired return on investment.
          </Typography>
        </li>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Appendix C */}
      <Typography variant="h4" component="h2" gutterBottom>
        Appendix C — Mapping claims ↔ citations ↔ experiments (example)
      </Typography>

      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body1" paragraph>
          <strong>Claim:</strong> "AI excels at interpretation."
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Citations:</strong> GPT-3 (Brown et al., 2020)<Ref id={3} />, PaLM (Chowdhery et
          al., 2022)<Ref id={5} />, InstructGPT (OpenAI, 2022)<Ref id={7} />.
        </Typography>
        <Typography variant="body1">
          <strong>Experiment:</strong> Label 2,500 production messy queries for gold intents;
          measure LLM recall/precision vs grammar parser; bootstrap test for significance.
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body1" paragraph>
          <strong>Claim:</strong> "Most AI deployments fail to scale."
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Citations:</strong> Boston Consulting Group (2024)<Ref id={21} /> finding 74%
          struggle to achieve value; Deloitte (2024)<Ref id={23} /> finding over two-thirds report
          30% or fewer experiments scale; NTT DATA (2024)<Ref id={24} /> documenting 70-85% ROI
          failure rates.
        </Typography>
        <Typography variant="body1">
          <strong>Experiment:</strong> Track 100 AI pilot projects for 18 months; measure success
          rates by project type, organization size, and implementation approach.
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body1" paragraph>
          <strong>Claim:</strong> "AI introduces new maintenance costs."
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Citations:</strong> Sculley et al. (2015)<Ref id={1} />; sustainable ML monitoring
          research (2024)<Ref id={19} />; AI incident increase data (Stanford HAI, 2025)
          <Ref id={22} />.
        </Typography>
        <Typography variant="body1">
          <strong>Experiment:</strong> Instrument team maintenance time across deterministic vs LLM
          features for 3 months; measure mean time to detect, mean time to repair, ongoing cost, and
          incident response overhead.
        </Typography>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* References */}
      <Typography variant="h4" component="h2" gutterBottom>
        References
      </Typography>

      <Box component="ol" sx={{ pl: 3 }}>
        <li id="ref-1">
          <Typography variant="body2" paragraph>
            Sculley, D., et al. (2015). Hidden Technical Debt in Machine Learning Systems.{' '}
            <em>NeurIPS</em>.{' '}
            <Link
              href="https://proceedings.neurips.cc/paper/2015/file/86df7dcfd896fcaf2674f757a2463eba-Paper.pdf"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-2">
          <Typography variant="body2" paragraph>
            OpenAI/Anthropic/Google production reports (2021-2024). Various engineering & safety
            posts describing real-world deployment lessons and red-teaming practices.
          </Typography>
        </li>
        <li id="ref-3">
          <Typography variant="body2" paragraph>
            Brown, T., et al. (2020). Language Models are Few-Shot Learners. <em>NeurIPS</em>.{' '}
            <Link href="https://arxiv.org/abs/2005.14165" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-4">
          <Typography variant="body2" paragraph>
            OpenAI. (2023). GPT-4 Technical Report. <em>arXiv preprint</em>.{' '}
            <Link href="https://arxiv.org/abs/2303.08774" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-5">
          <Typography variant="body2" paragraph>
            Chowdhery, A., et al. (2022). PaLM: Scaling Language Modeling with Pathways.{' '}
            <em>arXiv preprint</em>.{' '}
            <Link href="https://arxiv.org/abs/2204.02311" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-6">
          <Typography variant="body2" paragraph>
            Touvron, H., et al. (2023). LLaMA: Open and Efficient Foundation Language Models.{' '}
            <em>arXiv preprint</em>.{' '}
            <Link href="https://arxiv.org/abs/2302.13971" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-7">
          <Typography variant="body2" paragraph>
            Ouyang, L., et al. (2022). Training language models to follow instructions with human
            feedback. <em>NeurIPS</em>.{' '}
            <Link href="https://arxiv.org/abs/2203.02155" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-8">
          <Typography variant="body2" paragraph>
            Wei, J., et al. (2022). Chain-of-Thought Prompting Elicits Reasoning in Large Language
            Models. <em>NeurIPS</em>.{' '}
            <Link href="https://arxiv.org/abs/2201.11903" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-9">
          <Typography variant="body2" paragraph>
            Wang, X., et al. (2022). Self-Consistency Improves Chain of Thought Reasoning in
            Language Models. <em>ICLR</em>.{' '}
            <Link href="https://arxiv.org/abs/2203.11171" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-10">
          <Typography variant="body2" paragraph>
            Lin, S., Hilton, J., & Evans, O. (2022). TruthfulQA: Measuring How Models Mimic Human
            Falsehoods. <em>ACL</em>.{' '}
            <Link href="https://arxiv.org/abs/2109.07958" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-11">
          <Typography variant="body2" paragraph>
            Mitchell, M., et al. (2019). Model Cards for Model Reporting. <em>FAT</em>.{' '}
            <Link href="https://arxiv.org/abs/1810.03993" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-12">
          <Typography variant="body2" paragraph>
            Yao, S., et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models.{' '}
            <em>ICLR</em>.{' '}
            <Link href="https://arxiv.org/abs/2210.03629" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-13">
          <Typography variant="body2" paragraph>
            Bai, Y., et al. (2022). Constitutional AI: Harmlessness from AI Feedback.{' '}
            <em>arXiv preprint</em>.{' '}
            <Link href="https://arxiv.org/abs/2212.08073" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-14">
          <Typography variant="body2" paragraph>
            Liang, P., Bommasani, R., et al. (2023). Holistic Evaluation of Language Models.{' '}
            <em>Transactions on Machine Learning Research</em>.{' '}
            <Link href="https://arxiv.org/abs/2211.09110" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-15">
          <Typography variant="body2" paragraph>
            OpenAI. (2024). OpenAI o1 System Card. <em>OpenAI Technical Report</em>.{' '}
            <Link
              href="https://cdn.openai.com/o1-system-card-20241205.pdf"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-16">
          <Typography variant="body2" paragraph>
            Anthropic. (2024). Claude 3 Model Card. <em>Anthropic Technical Report</em>.
          </Typography>
        </li>
        <li id="ref-17">
          <Typography variant="body2" paragraph>
            Future of Life Institute. (2025). AI Safety Index 2025. <em>FLI Safety Report</em>.{' '}
            <Link
              href="https://futureoflife.org/ai-safety-index-summer-2025/"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-18">
          <Typography variant="body2" paragraph>
            Apollo Research. (2024). Frontier AI Models Show Concerning Deceptive Behavior in Safety
            Evaluations. <em>Apollo Research Report</em>.
          </Typography>
        </li>
        <li id="ref-19">
          <Typography variant="body2" paragraph>
            Wang, L., Chen, X., Zhang, Y., et al. (2024). How to Sustainably Monitor ML-Enabled
            Systems? <em>arXiv preprint</em>.{' '}
            <Link href="https://arxiv.org/abs/2404.19452" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-20">
          <Typography variant="body2" paragraph>
            McKinsey. (2024). The state of AI in early 2024: Gen AI adoption spikes and starts to
            generate value. <em>McKinsey Global Survey</em>.{' '}
            <Link
              href="https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-2024"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-21">
          <Typography variant="body2" paragraph>
            Boston Consulting Group. (2024). AI Adoption in 2024: 74% of Companies Struggle to
            Achieve and Scale Value. <em>BCG Survey Report</em>.{' '}
            <Link
              href="https://www.bcg.com/press/24october2024-ai-adoption-in-2024-74-of-companies-struggle-to-achieve-and-scale-value"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-22">
          <Typography variant="body2" paragraph>
            Stanford HAI. (2025). AI Index 2025: State of AI in 10 Charts.{' '}
            <em>Human-Centered AI Institute Report</em>.{' '}
            <Link
              href="https://hai.stanford.edu/news/ai-index-2025-state-of-ai-in-10-charts"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-23">
          <Typography variant="body2" paragraph>
            Deloitte. (2024). State of Generative AI in the Enterprise Q4 2024.{' '}
            <em>Deloitte AI Institute Survey</em>.{' '}
            <Link
              href="https://www.deloitte.com/us/en/what-we-do/capabilities/applied-artificial-intelligence/content/state-of-generative-ai-in-enterprise.html"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-24">
          <Typography variant="body2" paragraph>
            NTT DATA. (2024). Between 70-85% of GenAI deployment efforts are failing to meet their
            desired ROI. <em>Enterprise AI Study</em>.{' '}
            <Link
              href="https://www.nttdata.com/global/en/insights/focus/2024/between-70-85p-of-genai-deployment-efforts-are-failing"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-25">
          <Typography variant="body2" paragraph>
            OpenAI. (2024). OpenAI API Pricing. <em>Official OpenAI Pricing Documentation</em>.{' '}
            <Link href="https://openai.com/pricing" target="_blank" rel="noopener">
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-26">
          <Typography variant="body2" paragraph>
            Various LLM providers. (2024). Small model pricing comparison across providers.{' '}
            <em>Aggregate pricing data from multiple LLM API providers</em>.
          </Typography>
        </li>
        <li id="ref-27">
          <Typography variant="body2" paragraph>
            Amazon Web Services. (2024). EC2 Instance Pricing and Reserved Instances.{' '}
            <em>AWS Official Pricing Documentation</em>.{' '}
            <Link href="https://aws.amazon.com/ec2/pricing/" target="_blank" rel="noopener">
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-28">
          <Typography variant="body2" paragraph>
            DataCamp/Glassdoor. (2024). Machine Learning Engineer vs Software Engineer Salary
            Comparison. <em>2024 Salary Survey Data</em>.
          </Typography>
        </li>
        <li id="ref-29">
          <Typography variant="body2" paragraph>
            GMI Cloud/Lambda/CoreWeave. (2024). GPU Cloud Pricing Comparison for AI Workloads.{' '}
            <em>AI Infrastructure Pricing Analysis</em>.{' '}
            <Link
              href="https://www.gmicloud.ai/blog/a-guide-to-2025-gpu-cloud-pricing-comparison"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-30">
          <Typography variant="body2" paragraph>
            Anthropic. (2024). Claude API Pricing. <em>Official Anthropic Pricing Documentation</em>
            .{' '}
            <Link href="https://www.anthropic.com/pricing" target="_blank" rel="noopener">
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-31">
          <Typography variant="body2" paragraph>
            Srivastava, A., et al. (2022). Beyond the Imitation Game: Quantifying and extrapolating
            the capabilities of language models. <em>Transactions on Machine Learning Research</em>.{' '}
            <Link href="https://arxiv.org/abs/2206.04615" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-32">
          <Typography variant="body2" paragraph>
            Peng, S., et al. (2023). The Impact of AI on Developer Productivity: Evidence from
            GitHub Copilot. <em>arXiv preprint</em>.{' '}
            <Link href="https://arxiv.org/abs/2302.06590" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-33">
          <Typography variant="body2" paragraph>
            Nakano, R., et al. (2021). WebGPT: Browser-assisted question-answering with human
            feedback. <em>arXiv preprint</em>.{' '}
            <Link href="https://arxiv.org/abs/2112.09332" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-34">
          <Typography variant="body2" paragraph>
            Schick, T., et al. (2023). Toolformer: Language Models Can Teach Themselves to Use
            Tools. <em>arXiv preprint</em>.{' '}
            <Link href="https://arxiv.org/abs/2302.04761" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-35">
          <Typography variant="body2" paragraph>
            Ng, A., et al. (2021). Data-Centric AI Workshop. <em>NeurIPS 2021</em>.{' '}
            <Link href="https://datacentricai.org/" target="_blank" rel="noopener">
              Link
            </Link>
          </Typography>
        </li>
      </Box>
    </Box>
  );
};

export default Post1;
