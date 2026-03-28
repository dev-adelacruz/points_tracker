# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Roles' do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:target_user) { create(:user, :host) }

  describe '#update' do # rubocop:disable RSpec/EmptyExampleGroup
    path '/api/v1/users/{user_id}/role' do
      patch 'assigns a role to a user' do
        tags 'Roles'
        consumes 'application/json'
        parameter name: :user_id, in: :path, type: :integer
        parameter name: :params, in: :body, schema: {
          type: :object,
          properties: {
            role: { type: :string, enum: %w[admin emcee host] }
          },
          required: [ 'role' ]
        }

        response(200, 'updates role successfully') do
          let(:user_id) { target_user.id }
          let(:params) { { role: 'emcee' } }

          before { sign_in admin }

          run_test! do |response|
            expect(response).to have_http_status :ok
            expect(json_response).to include(
              status: include(code: 200, message: 'Role updated successfully.'),
              data: include(role: 'emcee')
            )
          end
        end

        response(403, 'returns forbidden for non-admin') do
          let(:user_id) { target_user.id }
          let(:params) { { role: 'admin' } }
          let(:non_admin) { create(:user, :host) }

          before { sign_in non_admin }

          run_test! do |response|
            expect(response).to have_http_status :forbidden
            expect(json_response).to include(message: 'Forbidden')
          end
        end

        response(401, 'returns unauthorized when not signed in') do
          let(:user_id) { target_user.id }
          let(:params) { { role: 'emcee' } }

          run_test! do |response|
            expect(response).to have_http_status :unauthorized
          end
        end

        response(404, 'returns not found for unknown user') do
          let(:user_id) { 0 }
          let(:params) { { role: 'emcee' } }

          before { sign_in admin }

          run_test! do |response|
            expect(response).to have_http_status :not_found
            expect(json_response).to include(message: 'User not found.')
          end
        end

        response(422, 'returns unprocessable entity for invalid role') do
          let(:user_id) { target_user.id }
          let(:params) { { role: 'superuser' } }

          before { sign_in admin }

          run_test! do |response|
            expect(response).to have_http_status :unprocessable_entity
          end
        end
      end
    end
  end
end
