package com.karasu256.karasulab.init

/** A unit of work that can describe itself as a step, so its progress can be shown to the user. */
interface ISteppable {
    /** Returns the title and description of this step. */
    fun getStepInfo(): StepInfo
}
