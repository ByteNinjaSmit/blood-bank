import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CreateDonor from '@/components/donor/Create-Donor'

const CreateDonorPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const campId = searchParams.get('campId')
  return (
    <CreateDonor
      originCampId={campId}
      onBack={() => {
        if (campId) {
          navigate(`/camp-donors?id=${campId}`)
        } else {
          navigate('/donor/view-donor')
        }
      }}
      backText={campId ? 'Back to Camp Donors' : 'Back to Donors'}
      afterCreate="stay"
      showPostCreateActions={true}
      onStartDonation={(donor) => navigate('/donations/create-donation', { state: { donor } })}
    />
  )
}

export default CreateDonorPage
