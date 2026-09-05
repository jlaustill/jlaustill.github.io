import { Typography, Box, Paper, Divider, Link } from '@mui/material';
import Ref from '../components/Ref';

const Post2 = () => {
  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        5 Things About AI That Might Surprise You
      </Typography>

      {/* Witty intro */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.100' }}>
        <Typography variant="body1">
          These five facts about AI might surprise you. If you've bet your career, your startup, or
          your sense of self-worth on AI being magic, a couple of them might even make you a little
          defensive. Stick with it anyway — this story has a happy ending.
        </Typography>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Quick list, no explanations */}
      <Box component="ol" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1" paragraph>
            AI is expensive, but you probably don't notice because it's massively subsidized
            <Ref id={1} />
            <Ref id={2} />
            <Ref id={3} />
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            AI is probabilistic, not deterministic — you can't expect the same exact answer twice
            <Ref id={4} />
            <Ref id={5} />
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            Most AI projects never make it into production
            <Ref id={6} />
            <Ref id={7} />
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            AI doesn't know when it's wrong
            <Ref id={8} />
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            AI isn't just software — it's an industrial build-out
            <Ref id={9} />
            <Ref id={10} />
            <Ref id={11} />
          </Typography>
        </li>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* The spin, up front */}
      <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
        Here's the twist: none of these are reasons to be afraid of AI. Once you actually understand
        these five things, you can see how each one is part of what makes AI a superpower. Let's take
        them one at a time.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Section 1 */}
      <Typography variant="h4" component="h2" gutterBottom>
        1. AI is expensive — you just don't feel it yet
      </Typography>
      <Typography variant="body1" paragraph>
        AI is expensive. Genuinely, seriously expensive to run. You just don't notice, because it's
        massively subsidized. A $20/month subscription feels cheap because it is cheap — for you. It
        doesn't reflect what it actually costs to run the model underneath it. Under heavy use, a
        single subscriber can cost a provider thousands of dollars a month in compute, far more than
        the subscription collects<Ref id={1} />. That gap is covered by venture capital and corporate
        balance sheets, not by your subscription fee.
      </Typography>
      <Typography variant="body1" paragraph>
        This isn't a temporary rounding error. OpenAI alone is projected to burn through $143 billion
        in cash as it races to build out capacity<Ref id={3} />, and reporting on the major labs
        makes clear that today's pricing is a land-grab, not a stable business model
        <Ref id={2} />. The bill comes due eventually — either through higher prices, more
        aggressive monetization, or providers that don't survive the transition.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Section 2 */}
      <Typography variant="h4" component="h2" gutterBottom>
        2. AI is probabilistic, not deterministic
      </Typography>
      <Typography variant="body1" paragraph>
        Give a calculator the same input twice and you get the same answer twice. Give an LLM the
        same prompt twice — same model, same settings, even temperature set to zero — and you can
        still get a different answer. This isn't a bug that better engineering will eventually fix;
        it's baked into how the math runs. Floating-point operations on a GPU aren't strictly
        associative, and the order those operations get batched in shifts with server load, which
        shifts the result<Ref id={4} /><Ref id={5} />. Determinism is a binary property, not a matter
        of degree — a system that can produce different outputs from identical inputs is, by
        definition, not deterministic.
      </Typography>
      <Typography variant="body1" paragraph>
        Here's the part that turns this from a limitation into a superpower: not every problem wants
        one correct answer. Ask an image model for "a medieval city built inside the ribcage of a
        colossal fossilized dragon" and you don't want a single canonical result — you want a hundred
        different interpretations to pick from. The variation isn't a defect to engineer away. It's
        the entire feature, and it's exactly why AI is so good at brainstorming, design exploration,
        and any task that means searching a space of possibilities instead of executing one known
        procedure.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Section 3 */}
      <Typography variant="h4" component="h2" gutterBottom>
        3. Most AI projects never make it into production
      </Typography>
      <Typography variant="body1" paragraph>
        Getting a model to produce an impressive demo is the easy part. RAND Corporation interviewed
        dozens of data scientists and engineers across more than 50 organizations and found that more
        than 80% of AI projects fail — roughly double the failure rate of ordinary, non-AI IT
        projects<Ref id={6} />. MIT's 2025 study of enterprise generative AI put the number even
        higher: 95% of pilots never produced a measurable profit-and-loss impact, despite tens of
        billions of dollars in enterprise spending<Ref id={7} />.
      </Typography>
      <Typography variant="body1" paragraph>
        "Failure" here is doing some quiet work, though. A prototype that never scales might be a
        failure to a CFO looking for ROI and a success to the engineers who learned what wouldn't
        work. The honest version of this surprise isn't "AI doesn't work" — it's that turning a
        working model into something that reliably creates value is a much harder problem than
        building the model in the first place.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Section 4 */}
      <Typography variant="h4" component="h2" gutterBottom>
        4. AI doesn't know when it's wrong
      </Typography>
      <Typography variant="body1" paragraph>
        This is probably the biggest conceptual surprise for people who haven't worked closely with
        these systems. An LLM has no internal flag that lights up when it's making something up
        versus when it's stating a well-supported fact. Research from OpenAI and Georgia Tech traces
        this back to how these models are trained and evaluated: the process rewards confident,
        fluent answers over honest uncertainty, so a model that says "I don't know" gets penalized
        relative to one that guesses convincingly<Ref id={8} />.
      </Typography>
      <Typography variant="body1" paragraph>
        The dangerous output isn't the one that's obviously wrong — you catch that one immediately.
        It's the answer that sounds exactly as confident and well-reasoned as a correct one, because
        fluency and accuracy are produced by the same mechanism and the model can't tell them apart
        any better than you can, at a glance.
      </Typography>
      <Typography variant="body1" paragraph>
        This is why you shouldn't trust AI blindly — but it's not a reason to avoid it either. Let it
        be creative. Let it brainstorm. Let it take swings it wouldn't take if it were worried about
        being wrong. Just always make it show its work: ask it to research, cite sources, and back up
        its claims. And whatever it hands you, the final call — the thing you ship, publish, or act
        on — stays a human decision.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Section 5 */}
      <Typography variant="h4" component="h2" gutterBottom>
        5. AI isn't just software — it's an industrial build-out
      </Typography>
      <Typography variant="body1" paragraph>
        It's tempting to think of AI the way we think of an app: write the code, ship it, done.
        Frontier AI doesn't work that way. Analysts project roughly $7.6 trillion in cumulative
        capital spending on AI compute, data centers, and power between 2026 and 2031, with annual
        hyperscaler AI capital expenditure alone projected to grow from around $765 billion in 2026
        to $1.6 trillion by 2031<Ref id={9} />. Global data-center electricity consumption is on
        track to more than double, from about 415 terawatt-hours in 2024 to roughly 945
        terawatt-hours by 2030<Ref id={10} /> — and the binding constraint on how fast AI can scale
        is increasingly the power grid, not chip supply<Ref id={11} />.
      </Typography>
      <Typography variant="body1" paragraph>
        That reframes what "AI capability" actually means. It isn't purely a software or algorithms
        race anymore — it's also a contest over chips, electricity, land, and capital. A model isn't
        something you simply download; running one at frontier scale requires physical infrastructure
        on an industrial scale.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Closing */}
      <Typography variant="h4" component="h2" gutterBottom>
        The takeaway
      </Typography>
      <Typography variant="body1" paragraph>
        AI is a superpower once you understand these five things — not despite them, but because of
        them. Here's what that actually buys you:
      </Typography>
      <Box component="ol" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body1" paragraph>
            <strong>It's subsidized</strong> — so you can get amazing value out of frontier AI right
            now, while someone else's balance sheet is picking up the difference.
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            <strong>It's probabilistic</strong> — so you can harness that unpredictability to
            brainstorm and see a problem from a totally different angle than the one you started with.
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            <strong>Most projects fail</strong> — so once you know why, you know exactly what to
            avoid and what actually works, instead of learning it the expensive way.
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            <strong>It doesn't know when it's wrong</strong> — so it will boldly take you to new
            places, whether you're coding, writing a poem, or generating an image, without the
            hesitation a "safe" tool would build in.
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            <strong>It's an industrial build-out</strong> — so this whole ride is running on
            borrowed time and someone else's capital. Take advantage of the subsidy while it lasts.
          </Typography>
        </li>
      </Box>
      <Typography variant="body1" paragraph>
        The people who get the most value out of AI won't be the ones who trust it blindly. They'll
        be the ones who know exactly when to verify, when to lean on something else instead, and when
        to let the uncertainty work in their favor.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* References */}
      <Typography variant="h4" component="h2" gutterBottom>
        References
      </Typography>
      <Box component="ol" sx={{ pl: 3 }}>
        <li id="ref-1">
          <Typography variant="body2" paragraph>
            Cybernews (2025). New analysis shows ChatGPT and Claude subscriptions may cost AI firms
            thousands per user.{' '}
            <Link
              href="https://cybernews.com/ai-news/chatgpt-claude-usage-costs-openai-anthropic/"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-2">
          <Typography variant="body2" paragraph>
            Axios (2026). AI companies like OpenAI, Google cover costs. But not forever.{' '}
            <Link
              href="https://www.axios.com/2026/03/12/ai-models-costs-ipo-pricing"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-3">
          <Typography variant="body2" paragraph>
            eMarketer. OpenAI&apos;s forecast $143 billion cash outflow raises stakes for AI
            monetization.{' '}
            <Link
              href="https://www.emarketer.com/content/openai-forecast-143-billion-loss-raises-stakes-ai-monetization"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-4">
          <Typography variant="body2" paragraph>
            Thinking Machines Lab (2025). Defeating Nondeterminism in LLM Inference.{' '}
            <Link
              href="https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-5">
          <Typography variant="body2" paragraph>
            Unstract. Why is deterministic output from LLMs nearly impossible?{' '}
            <Link
              href="https://unstract.com/blog/understanding-why-deterministic-output-from-llms-is-nearly-impossible/"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-6">
          <Typography variant="body2" paragraph>
            Ryseff, J., De Bruhl, B. F., &amp; Newberry, S. J. (2024). The Root Causes of Failure for
            Artificial Intelligence Projects and How They Can Succeed. <em>RAND Corporation</em>,
            RR-A2680-1.{' '}
            <Link
              href="https://www.rand.org/pubs/research_reports/RRA2680-1.html"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-7">
          <Typography variant="body2" paragraph>
            MIT Media Lab / Project NANDA (2025). The GenAI Divide: State of AI in Business 2025, as
            reported by Yahoo Finance.{' '}
            <Link
              href="https://finance.yahoo.com/news/mit-report-95-generative-ai-105412686.html"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-8">
          <Typography variant="body2" paragraph>
            Kalai, A. T., Nachum, O., Vempala, S. S., &amp; Zhang, E. (2025). Why Language Models
            Hallucinate. <em>OpenAI &amp; Georgia Tech</em>.{' '}
            <Link href="https://arxiv.org/pdf/2509.04664" target="_blank" rel="noopener">
              arXiv
            </Link>
          </Typography>
        </li>
        <li id="ref-9">
          <Typography variant="body2" paragraph>
            Goldman Sachs Insights. Tracking Trillions: The Assumptions Shaping the Scale of the AI
            Build-Out.{' '}
            <Link
              href="https://www.goldmansachs.com/insights/articles/tracking-trillions-the-assumptions-shaping-scale-of-the-ai-build-out"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-10">
          <Typography variant="body2" paragraph>
            International Energy Agency. Energy and AI — Executive Summary.{' '}
            <Link
              href="https://www.iea.org/reports/energy-and-ai/executive-summary"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
        <li id="ref-11">
          <Typography variant="body2" paragraph>
            Inflect. Data Center Power Shortage 2026: Why Grid Capacity Is Now the Bigger Constraint
            Than GPUs.{' '}
            <Link
              href="https://inflect.com/blog/data-center-power-shortage-2026-why-grid-capacity-is-now-the-bigger-constraint-than-gpus"
              target="_blank"
              rel="noopener"
            >
              Link
            </Link>
          </Typography>
        </li>
      </Box>
    </Box>
  );
};

export default Post2;
