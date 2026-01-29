// src/components/Footer.jsx
import partner1 from '../assets/partner1.png'
import partner2 from '../assets/partner2.png'
import partner3 from '../assets/partner3.png'

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16">
      <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-4 gap-12">
        <div>
          <h3 className="text-white font-bold text-xl mb-4">AA Trading</h3>
          <p className="text-slate-400 max-w-xs">
            Premium trading company focused on quality, trust & innovation.
          </p>
          <div className="flex gap-4 mt-4">
            {[partner1, partner2, partner3].map((p, i) => (
              <img key={i} src={p} className="h-10 opacity-80" />
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Products</h4>
          <ul className="space-y-2 text-sm">
            <li><a className="hover:text-white">Trading Tools</a></li>
            <li><a className="hover:text-white">Analytics</a></li>
            <li><a className="hover:text-white">Reports</a></li>
            <li><a className="hover:text-white">Subscriptions</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><a className="hover:text-white">About Us</a></li>
            <li><a className="hover:text-white">Careers</a></li>
            <li><a className="hover:text-white">Blog</a></li>
            <li><a className="hover:text-white">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><a className="hover:text-white">FAQ</a></li>
            <li><a className="hover:text-white">Terms of Service</a></li>
            <li><a className="hover:text-white">Privacy Policy</a></li>
            <li><a className="hover:text-white">Refund Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-700 mt-12">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} AA Trading. All rights reserved.</p>
          <div className="flex gap-3 mt-2 md:mt-0">
            <span className="px-2 py-1 bg-slate-800 rounded text-xs">Visa</span>
            <span className="px-2 py-1 bg-slate-800 rounded text-xs">MasterCard</span>
            <span className="px-2 py-1 bg-slate-800 rounded text-xs">PayPal</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer