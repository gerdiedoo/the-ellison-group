export const site = {
  name:'The Ellison Group', phone:'(501) 725-1227', phone_href:'tel:+15017251227',
  email:'hello@theellisongroup.com', address:'12814 Cantrell Rd, Little Rock AR 72223',
  socials:{ Instagram:'https://www.instagram.com/theellisongroup/', Facebook:'https://www.facebook.com/search/top?q=The%20Ellison%20Group%20Little%20Rock', LinkedIn:'https://www.linkedin.com/search/results/companies/?keywords=The%20Ellison%20Group', YouTube:'https://www.youtube.com/results?search_query=The+Ellison+Group+Little+Rock', 'Google reviews':'https://www.google.com/maps/search/?api=1&query=The+Ellison+Group+12814+Cantrell+Rd+Little+Rock', Zillow:'https://www.zillow.com/professionals/real-estate-agent-reviews/little-rock-ar/' },
  stats:[{value:33,suffix:'+',label:'Years of Real Estate Experience'},{value:1131,suffix:'+',label:'Closed Transactions'},{value:450,prefix:'$',suffix:'K+',label:'Average Price'}],
};
export const navigation = [
  ['Home','/'],['Meet the Team','/team'],['Featured Properties','/properties/sale'],['Past Transactions','/properties/sold'],['Home Search','/home-search/listings'],['Home Valuation','/home-valuation'],['Neighborhoods','/neighborhoods'],['Testimonials','/testimonials'],["Buyer's Guide",'/buyers-guide'],["Seller's Guide",'/sellers-guide'],['Blog','/blog'],['Contact Us','/contact'],['My Search Portal','/home-search/account'],
] as const;
