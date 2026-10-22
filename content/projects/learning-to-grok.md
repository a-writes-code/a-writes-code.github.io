# Can a model learn a new task from its prompt?

A model may see examples of a new task in its prompt and then answer a new question. Its weights do not change during this process. What did training teach it that makes this possible?

## A controlled version of a familiar capability

We study *in-context learning* using a family of modular arithmetic tasks. Each task has the form z = ax + by, with the result taken modulo a prime number. Changing the coefficients gives a different task.

We train a GPT-style transformer on some tasks and reserve others for testing. The comparison separates success on new examples of familiar tasks from success on genuinely new coefficient pairs.

## Task diversity changes what the model learns

As the number of training tasks grows, the model can move from solving familiar tasks to generalizing across tasks. We examine the representations in its attention heads and feed-forward layers to understand the computations behind this behavior.

The transition depends on architecture and training. In the deeper models we study, generalization to unseen tasks can be transient. Training longer is not always better; early stopping can matter.

## Reading the little example

The animation reveals examples of one hidden modular rule, then asks a new question. It illustrates the task format and the role of context. The displayed answer comes from exact arithmetic, not a transformer running in your browser. The research question is when a trained network learns to perform this kind of inference.

> **The takeaway**
>
> Training on a more diverse collection of tasks can change whether a model learns reusable computations.

## A few useful terms

- **In-context learning.** Using examples in a prompt to perform a task without updating model weights.
- **Modular arithmetic.** Arithmetic in which results wrap around after a fixed integer.
- **Out-of-distribution task.** A task excluded from the set of tasks used for training.
