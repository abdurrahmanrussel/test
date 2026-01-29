// src/components/Button.jsx
import React from 'react'


const Button = ({ children, className = '', ...props }) => {
return (
<button
{...props}
className={`
inline-flex items-center justify-center
rounded-full px-6 py-2.5
text-sm font-medium
bg-gradient-to-r from-blue-600 to-indigo-600
text-white
shadow-md
hover:shadow-lg hover:from-blue-700 hover:to-indigo-700
transition-all duration-300
focus:outline-none focus:ring-2 focus:ring-blue-400
${className}
`}
>
{children}
</button>
)
}


export default Button