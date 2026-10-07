package com.karasu256.karasulab.init

/** A piece of the app's launch work, run in order by the loading screen before the first screen is shown. */
interface IInitializable : ISteppable {
    /** Performs this initialization. */
    suspend fun init()

    /** Returns the information describing this initialization. */
    fun getInfo(): StepInfo = getStepInfo()
}
