import React from 'react'
import { Loader2 } from 'lucide-react'

const Loader = () => {
    return (
        <div>
            <div className="flex justify-center items-center min-h-screen">
                <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
                    <span className="animate-spin text-primary" role="status" aria-label="Loading">
                        <Loader2 className="w-16 h-16 text-orange-500" />
                    </span>
                </div>
            </div>
        </div>
    )
}

export default Loader