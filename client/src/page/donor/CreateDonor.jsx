import React from 'react'
import { useNavigate } from 'react-router-dom'
import CreateDonor from '@/components/donor/Create-Donor'

const CreateDonorPage = () => {
  const navigate = useNavigate()
  return (
    <CreateDonor
      onBack={() => navigate('/donor/view-donor')}
      backText="Back to Donors"
      afterCreate="stay"
      showPostCreateActions={true}
      onStartDonation={(donor) => navigate('/donations/create-donation', { state: { donor } })}
    />
  )
}

export default CreateDonorPage
