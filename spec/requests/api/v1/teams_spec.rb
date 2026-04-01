# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Teams" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }
  let(:host) { create(:user, :host) }
  let(:team1) { create(:team) }
  let(:team2) { create(:team) }

  describe "#index" do
    path "/api/v1/teams" do
      get "lists teams scoped to the current user" do
        tags "Teams"
        produces "application/json"

        response(200, "returns all teams for admin") do
          before do
            team1
            team2
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(2)
            expect(json_response[:status][:code]).to eq(200)
          end
        end

        response(200, "returns only assigned teams for emcee") do
          before do
            create(:team_emcee_assignment, user: emcee, team: team1)
            team2
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:id]).to eq(team1.id)
          end
        end

        response(200, "returns empty list for emcee with no team assignments") do
          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data]).to be_empty
          end
        end

        response(403, "returns forbidden for host") do
          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(401, "returns unauthorized when not signed in") do
          run_test! do
            expect(response).to have_http_status :unauthorized
          end
        end
      end

      post "creates a new team (admin only)" do
        tags "Teams"
        consumes "application/json"
        produces "application/json"
        parameter name: :params, in: :body, schema: {
          type: :object,
          properties: {
            team: {
              type: :object,
              properties: {
                name: { type: :string },
                description: { type: :string }
              },
              required: [ "name" ]
            }
          }
        }

        response(201, "creates team for admin") do
          let(:params) { { team: { name: "New Team", description: "A description" } } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :created
            expect(json_response[:data][:name]).to eq("New Team")
            expect(json_response[:data][:description]).to eq("A description")
            expect(json_response[:data][:active]).to be true
            expect(json_response[:data][:host_count]).to eq(0)
          end
        end

        response(422, "returns error for duplicate name") do
          let(:params) { { team: { name: team1.name } } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :unprocessable_entity
          end
        end

        response(403, "returns forbidden for emcee") do
          let(:params) { { team: { name: "Blocked Team" } } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(401, "returns unauthorized when not signed in") do
          let(:params) { { team: { name: "Unauth Team" } } }

          run_test! do
            expect(response).to have_http_status :unauthorized
          end
        end
      end
    end
  end

  describe "#update" do
    path "/api/v1/teams/{id}" do
      parameter name: :id, in: :path, type: :integer

      patch "updates a team (admin only)" do
        tags "Teams"
        consumes "application/json"
        produces "application/json"
        parameter name: :params, in: :body, schema: {
          type: :object,
          properties: {
            team: {
              type: :object,
              properties: {
                name: { type: :string },
                description: { type: :string }
              }
            }
          }
        }

        response(200, "renames team for admin") do
          let(:id) { team1.id }
          let(:params) { { team: { name: "Renamed Team" } } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:name]).to eq("Renamed Team")
          end
        end

        response(404, "returns not found for missing team") do
          let(:id) { 0 }
          let(:params) { { team: { name: "Ghost" } } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :not_found
          end
        end

        response(403, "returns forbidden for emcee") do
          let(:id) { team1.id }
          let(:params) { { team: { name: "No Access" } } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end

  describe "#destroy" do
    path "/api/v1/teams/{id}" do
      parameter name: :id, in: :path, type: :integer

      delete "deactivates a team (admin only, soft delete)" do
        tags "Teams"
        produces "application/json"

        response(200, "deactivates team for admin") do
          let(:id) { team1.id }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:active]).to be false
            expect(team1.reload.active).to be false
          end
        end

        response(404, "returns not found for missing team") do
          let(:id) { 0 }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :not_found
          end
        end

        response(403, "returns forbidden for emcee") do
          let(:id) { team1.id }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
